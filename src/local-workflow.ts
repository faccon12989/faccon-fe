import type { AdjustResult, LocalCommand, LocalDocument, LocalSession, LocalStage, LocalTerms, LocalTrade } from "./types";

export const STAGE_LABEL: Readonly<Record<LocalStage, string>> = {
  draft: "자료 준비", requested: "자료 제출 대기", submitted: "자료 검토", agreement: "약정 승인 대기",
  active: "운영 중", adjustment: "조정 승인 대기", ready: "ERP 반영 대기", completed: "반영 완료",
};
export const canAccess = (trade: LocalTrade, session: LocalSession): boolean => trade[session.role] === session.company;
export const validDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export const visibleDocuments = (trade: LocalTrade, session: LocalSession): readonly LocalDocument[] => {
  if (!canAccess(trade, session)) return [];
  return trade.documents.filter((doc: LocalDocument): boolean => doc.scope === "shared" || doc.owner === session.company);
};
export const validateTerms = (terms: LocalTerms): void => {
  const values = [terms.p0, terms.m0, terms.i0, terms.threshold, terms.qty];
  if (values.some((value: number): boolean => !Number.isFinite(value) || value <= 0)) throw new Error("단가·원재료비·지표·수량·조정요건은 0보다 큰 숫자로 입력해 주세요.");
  if (terms.m0 > terms.p0) throw new Error("제품당 원재료비는 기준 납품단가를 넘을 수 없습니다.");
  if (!Number.isInteger(terms.qty)) throw new Error("수량은 정수로 입력해 주세요.");
  if (!terms.indexName.trim() || !terms.cycle.trim()) throw new Error("기준지표와 조정주기를 입력해 주세요.");
  if (!validDate(terms.effectiveDate)) throw new Error("유효한 약정 적용 시작일을 입력해 주세요.");
};
export const calculateLocal = (trade: LocalTrade, indexValue: number): AdjustResult => {
  validateTerms(trade.terms);
  if (!Number.isFinite(indexValue) || indexValue <= 0) throw new Error("비교지표는 0보다 커야 합니다.");
  const { p0, m0, i0, threshold, qty } = trade.terms;
  const rate = (indexValue - i0) / i0;
  const triggered = Math.abs(rate) * 100 >= threshold - 1e-9;
  const price = Math.round(triggered ? p0 + m0 * rate : p0);
  return { it: indexValue, rate, triggered, price, diffPerUnit: price - p0, total: (price - p0) * qty };
};
const addEvent = (trade: LocalTrade, session: LocalSession, action: string, detail: string): LocalTrade => ({
  ...trade, events: [...trade.events, { id: crypto.randomUUID(), at: new Date().toISOString(), actor: session.company, role: session.role, action, detail }],
});
const ensure = (condition: boolean, message: string): void => { if (!condition) throw new Error(message); };
export const addLocalDocument = (trade: LocalTrade, doc: LocalDocument, session: LocalSession): LocalTrade => {
  ensure(canAccess(trade, session), "이 거래에 접근할 수 없습니다.");
  ensure(doc.owner === session.company, "자료 등록 주체가 일치하지 않습니다.");
  const preparing = ["draft", "requested", "submitted", "agreement"].includes(trade.stage);
  ensure(preparing || ["발주서", "청구서·세금계산서", "지급증빙"].includes(doc.kind), "확정한 약정의 자료는 변경할 수 없습니다. 이행 증빙은 별도 등록합니다.");
  const updated: LocalTrade = { ...trade, documents: [...trade.documents, doc], buyerApproved: preparing ? false : trade.buyerApproved, supplierApproved: preparing ? false : trade.supplierApproved, stage: trade.stage === "agreement" ? "submitted" : trade.stage };
  return addEvent(updated, session, "자료 등록", `${doc.kind} · ${doc.scope === "private" ? "회사 내부 보관" : "상대 기업 공유"}`);
};
export const runLocalCommand = (trade: LocalTrade, session: LocalSession, command: LocalCommand): LocalTrade => {
  ensure(canAccess(trade, session), "이 거래에 접근할 수 없습니다.");
  const buyer = session.role === "buyer";
  const note = command.note?.trim() ?? "";
  switch (command.action) {
    case "request": {
      ensure(buyer && ["draft", "requested", "submitted"].includes(trade.stage), "지금은 자료를 요청할 수 없습니다.");
      ensure(note.length > 0, "필요한 자료와 기간을 입력해 주세요.");
      return addEvent({ ...trade, stage: "requested", request: note, buyerApproved: false, supplierApproved: false }, session, "자료 요청", note);
    }
    case "submit": {
      ensure(!buyer && ["draft", "requested"].includes(trade.stage), "지금은 제출할 수 없습니다.");
      ensure(visibleDocuments(trade, session).some((doc: LocalDocument): boolean => doc.scope === "shared"), "상대 기업이 검토할 공유 자료를 1개 이상 등록해 주세요.");
      return addEvent({ ...trade, stage: "submitted" }, session, "자료 제출", note || "공유 자료 검토를 요청했습니다.");
    }
    case "return": {
      ensure(buyer && ["submitted", "agreement"].includes(trade.stage), "지금은 보완을 요청할 수 없습니다.");
      ensure(note.length > 0, "보완이 필요한 내용을 입력해 주세요.");
      return addEvent({ ...trade, stage: "requested", request: note, buyerApproved: false, supplierApproved: false }, session, "보완 요청", note);
    }
    case "approveAgreement": {
      ensure(["submitted", "agreement"].includes(trade.stage) || (trade.entry === "existing" && trade.stage === "draft"), "자료 제출 후 약정을 승인해 주세요.");
      ensure(buyer ? !trade.buyerApproved : !trade.supplierApproved, "이미 약정 조건을 승인했습니다.");
      const buyerApproved = trade.buyerApproved || buyer;
      const supplierApproved = trade.supplierApproved || !buyer;
      return addEvent({ ...trade, buyerApproved, supplierApproved, stage: buyerApproved && supplierApproved ? "active" : "agreement" }, session, "약정 조건 승인", "표시된 기준단가·원재료비·지표·주기·단가 적용 기준을 확인했습니다.");
    }
    case "proposeAdjustment": {
      ensure(["active", "completed"].includes(trade.stage), "양사 약정 승인 후 조정을 제안할 수 있습니다.");
      const indexValue = command.indexValue ?? 0;
      ensure(calculateLocal(trade, indexValue).triggered, "지표 변동이 약정의 조정요건에 도달하지 않았습니다.");
      ensure(Boolean(command.source?.trim()), "확인한 지표의 출처와 기준 기간을 입력해 주세요.");
      const effectiveDate = command.effectiveDate ?? "";
      ensure(validDate(effectiveDate) && effectiveDate >= trade.terms.effectiveDate, "조정단가 반영일은 약정 적용 시작일 이후여야 합니다.");
      ensure(!trade.adjustment || effectiveDate > trade.adjustment.effectiveDate, "다음 조정의 반영일은 이전 반영일 이후로 입력해 주세요.");
      const history = trade.adjustment ? [...(trade.adjustmentHistory ?? []), trade.adjustment] : trade.adjustmentHistory ?? [];
      return addEvent({ ...trade, stage: "ready", adjustmentHistory: history, adjustment: { revision: (trade.adjustment?.revision ?? 0) + 1, indexValue, effectiveDate, source: command.source?.trim() ?? "", buyerApproved: false, supplierApproved: false } }, session, "약정 산식 계산", `비교지표 ${indexValue} · 반영일 ${effectiveDate}`);
    }
    case "approveAdjustment": {
      const adjustment = trade.adjustment;
      ensure(["ready", "completed"].includes(trade.stage) && Boolean(adjustment), "확인할 조정 결과가 없습니다.");
      if (!adjustment) return trade;
      ensure(buyer ? !adjustment.buyerApproved : !adjustment.supplierApproved, "이미 조정안을 승인했습니다.");
      const next = { ...adjustment, buyerApproved: adjustment.buyerApproved || buyer, supplierApproved: adjustment.supplierApproved || !buyer };
      return addEvent({ ...trade, adjustment: next }, session, "계산 결과 확인", `조정 ${adjustment.revision}차 · 반영일 ${adjustment.effectiveDate}`);
    }
    case "submitInvoice": {
      const adjustment = trade.adjustment;
      ensure(!buyer && trade.stage === "ready" && Boolean(adjustment), "수탁기업이 계산된 조정 건의 청구정보를 제출할 수 있습니다.");
      if (!adjustment) return trade;
      ensure(Number.isFinite(command.invoicePrice) && (command.invoicePrice ?? -1) >= 0, "청구서 단가를 올바르게 입력해 주세요.");
      ensure(Boolean(command.reference?.trim()), "청구서 식별번호를 입력해 주세요.");
      return addEvent({ ...trade, adjustment: { ...adjustment, invoicePrice: command.invoicePrice, invoiceReference: command.reference?.trim(), invoiceSubmittedAt: new Date().toISOString() } }, session, "청구정보 제출", `청구서 ${command.reference?.trim()} · 단가 ${command.invoicePrice}`);
    }
    case "reflect": {
      const adjustment = trade.adjustment;
      ensure(buyer && trade.stage === "ready" && Boolean(adjustment), "약정 산식 계산 후 위탁기업이 반영을 확인할 수 있습니다.");
      if (!adjustment) return trade;
      const expected = calculateLocal(trade, adjustment.indexValue).price;
      ensure(Boolean(adjustment.invoiceSubmittedAt), "수탁기업이 청구정보를 먼저 제출해야 합니다.");
      ensure(command.poPrice === expected && adjustment.invoicePrice === expected, "발주서와 청구서 단가가 약정의 조정단가와 일치하지 않습니다.");
      const basisDate = trade.terms.basis === "delivery" ? command.deliveryDate : command.inspectionDate;
      ensure(validDate(basisDate ?? "") && (basisDate ?? "") >= adjustment.effectiveDate, "약정의 적용 기준일이 조정단가 반영일 이전이거나 날짜가 올바르지 않습니다. 이전 단가 적용 대상인지 확인해 주세요.");
      ensure(!command.deliveryDate || validDate(command.deliveryDate), "유효한 납품일을 입력해 주세요.");
      ensure(!command.inspectionDate || validDate(command.inspectionDate), "유효한 검수일을 입력해 주세요.");
      ensure(!command.deliveryDate || !command.inspectionDate || command.inspectionDate >= command.deliveryDate, "검수일은 납품일 이전일 수 없습니다.");
      ensure(Boolean(command.reference?.trim()), "발주·청구 식별번호를 입력해 주세요.");
      return addEvent({ ...trade, stage: "completed", adjustment: { ...adjustment, poPrice: command.poPrice, reference: command.reference?.trim(), deliveryDate: command.deliveryDate, inspectionDate: command.inspectionDate } }, session, "반영 대조 완료", "위탁기업이 발주 단가와 수탁기업의 청구 단가, 약정 적용 기준일을 확인했습니다.");
    }
  }
};
export const requiresAction = (trade: LocalTrade, session: LocalSession): boolean => {
  if (!canAccess(trade, session) || trade.stage === "completed") return false;
  const buyer = session.role === "buyer";
  if (trade.stage === "requested") return !buyer;
  if (trade.stage === "agreement") return !(buyer ? trade.buyerApproved : trade.supplierApproved);
  if (trade.stage === "adjustment") return !(buyer ? trade.adjustment?.buyerApproved : trade.adjustment?.supplierApproved);
  if (trade.stage === "ready") return buyer ? Boolean(trade.adjustment?.invoiceSubmittedAt) : !trade.adjustment?.invoiceSubmittedAt || !trade.adjustment.supplierApproved;
  return trade.stage !== "active";
};
export const taskLabel = (trade: LocalTrade, session: LocalSession): string => {
  const buyer = session.role === "buyer";
  switch (trade.stage) {
    case "draft": return buyer ? "필요한 자료를 요청해 주세요" : "검토할 자료를 등록해 주세요";
    case "requested": return buyer ? "수탁기업의 자료 제출을 기다립니다" : "요청받은 자료를 제출해 주세요";
    case "submitted": return buyer ? "제출자료와 약정 조건을 확인해 주세요" : "약정 조건을 확인해 주세요";
    case "agreement": return (buyer ? trade.buyerApproved : trade.supplierApproved) ? "상대 기업의 약정 승인을 기다립니다" : "약정 조건을 승인해 주세요";
    case "active": return "약정 주기에 맞춰 지표를 확인해 주세요";
    case "adjustment": return (buyer ? trade.adjustment?.buyerApproved : trade.adjustment?.supplierApproved) ? "상대 기업의 조정 승인을 기다립니다" : "조정단가를 확인하고 승인해 주세요";
    case "ready": return buyer ? (trade.adjustment?.invoiceSubmittedAt ? "발주·청구 단가 반영을 확인해 주세요" : "수탁기업의 청구정보를 기다립니다") : (!trade.adjustment?.invoiceSubmittedAt ? "조정단가에 맞춰 청구정보를 제출해 주세요" : !trade.adjustment.supplierApproved ? "제출한 청구정보와 계산 결과를 확인해 주세요" : "위탁기업의 단가 반영을 기다립니다");
    case "completed": return "반영한 내역과 증빙을 확인할 수 있습니다";
  }
};
