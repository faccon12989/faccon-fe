import { describe, expect, it } from "vitest";
import { addLocalDocument, calculateLocal, canAccess, requiresAction, runLocalCommand, taskLabel, validateTerms, validDate, visibleDocuments } from "./local-workflow";
import { exportPriceCsv, exportTradeText } from "./local-export";
import type { LocalDocument, LocalSession, LocalTrade } from "./types";

const buyer: LocalSession = { role: "buyer", company: "위탁테스트", name: "담당자" };
const supplier: LocalSession = { role: "supplier", company: "수탁테스트", name: "담당자" };
const outsider: LocalSession = { role: "buyer", company: "무관기업", name: "담당자" };
const base = (): LocalTrade => ({ id: "T-TEST", title: "하우징", buyer: buyer.company, supplier: supplier.company, material: "알루미늄", entry: "new", createdAt: "2026-11-01T00:00:00Z", terms: { p0: 10000, m0: 4000, i0: 100, threshold: 5, qty: 1000, indexName: "테스트 지표", cycle: "매월", basis: "delivery", effectiveDate: "2026-11-01" }, stage: "draft", request: "", buyerApproved: false, supplierApproved: false, documents: [], events: [] });
const document = (scope: "private" | "shared" = "shared"): LocalDocument => ({ id: `DOC-${scope}`, name: scope === "private" ? "비밀원가.xlsx" : "검토결과.pdf", size: 100, type: "application/pdf", kind: "원가 검토 결과", scope, owner: supplier.company, uploadedAt: "2026-11-01T00:00:00Z" });
const active = (): LocalTrade => {
  const uploaded = addLocalDocument(base(), document(), supplier);
  const requested = runLocalCommand(uploaded, buyer, { action: "request", note: "검토 결과를 공유해 주세요." });
  const submitted = runLocalCommand(requested, supplier, { action: "submit" });
  const first = runLocalCommand(submitted, buyer, { action: "approveAgreement" });
  return runLocalCommand(first, supplier, { action: "approveAgreement" });
};
const calculated = (trade: LocalTrade = active()): LocalTrade => runLocalCommand(trade, buyer, { action: "proposeAdjustment", indexValue: 110, effectiveDate: "2026-11-15", source: "테스트 지표 11월 평균" });
const invoiced = (trade: LocalTrade = calculated()): LocalTrade => runLocalCommand(trade, supplier, { action: "submitInvoice", invoicePrice: 10400, reference: "INV1" });

describe("등록한 거래의 양사 업무 흐름", (): void => {
  it("자료 요청부터 약정 승인·정기계산·ERP 대조까지 한 거래로 연결합니다", (): void => {
    const trade = active();
    expect(trade.stage).toBe("active");
    expect(trade.buyerApproved && trade.supplierApproved).toBe(true);
    const ready = calculated(trade);
    expect(ready.stage).toBe("ready");
    expect(ready.adjustment?.buyerApproved).toBe(false);
    expect(exportPriceCsv(ready)).toContain("10400");
    const done = runLocalCommand(invoiced(ready), buyer, { action: "reflect", poPrice: 10400, invoicePrice: 10400, deliveryDate: "2026-11-15", inspectionDate: "2026-11-16", reference: "PO1 / INV1" });
    expect(done.stage).toBe("completed");
    expect(done.events.at(-1)?.action).toBe("반영 대조 완료");
    expect(exportTradeText(done, buyer)).toContain("PO1 / INV1");
    expect(base().documents).toHaveLength(0);
  });
  it("기존 약정은 자료 제출 단계를 생략하되 양사 조건 확인을 거칩니다", (): void => {
    const existing: LocalTrade = { ...base(), entry: "existing" };
    const first = runLocalCommand(existing, supplier, { action: "approveAgreement" });
    expect(first.stage).toBe("agreement");
    expect(runLocalCommand(first, buyer, { action: "approveAgreement" }).stage).toBe("active");
    expect((): LocalTrade => runLocalCommand(base(), buyer, { action: "approveAgreement" })).toThrow();
  });
  it("한 회사의 승인만으로 약정 운영을 시작하지 않습니다", (): void => {
    const first = runLocalCommand({ ...base(), stage: "submitted" }, buyer, { action: "approveAgreement" });
    expect(first.stage).toBe("agreement");
    expect((): LocalTrade => calculated(first)).toThrow();
    expect((): LocalTrade => runLocalCommand(first, buyer, { action: "approveAgreement" })).toThrow("이미");
  });
  it("보완 요청 시 양사 약정 확인을 초기화합니다", (): void => {
    const trade: LocalTrade = { ...base(), stage: "agreement", buyerApproved: true };
    const returned = runLocalCommand(trade, buyer, { action: "return", note: "대상 월을 보완해 주세요." });
    expect(returned.stage).toBe("requested");
    expect(returned.buyerApproved).toBe(false);
    expect(returned.request).toContain("대상 월");
  });
  it("정기 계산 확인은 선택이며 양사 재승인이 ERP 반영을 막지 않습니다", (): void => {
    const ready = calculated();
    const checked = runLocalCommand(ready, supplier, { action: "approveAdjustment" });
    expect(checked.stage).toBe("ready");
    expect(checked.adjustment?.supplierApproved).toBe(true);
    expect(checked.adjustment?.buyerApproved).toBe(false);
    expect(exportPriceCsv(checked)).toContain("10400");
  });
  it("새 조정 주기를 계산해도 이전 조정 결과와 반영번호를 보존합니다", (): void => {
    const done = runLocalCommand(invoiced(), buyer, { action: "reflect", poPrice: 10400, invoicePrice: 10400, deliveryDate: "2026-11-15", reference: "NOV-PO" });
    const next = runLocalCommand(done, supplier, { action: "proposeAdjustment", indexValue: 90, effectiveDate: "2026-12-15", source: "12월 평균" });
    expect(next.adjustment?.revision).toBe(2);
    expect(next.adjustmentHistory).toHaveLength(1);
    expect(next.adjustmentHistory?.[0]?.reference).toBe("NOV-PO");
    expect(exportTradeText(next, buyer)).toContain("NOV-PO");
  });
});
describe("회사별 자료 범위와 역할", (): void => {
  it("수탁기업의 청구 미제출 건은 처리할 업무에 포함합니다", (): void => {
    const trade = calculated();
    expect(requiresAction(trade, supplier)).toBe(true);
    expect(taskLabel(trade, supplier)).toContain("청구정보를 제출");
    expect(requiresAction(trade, buyer)).toBe(false);
  });
  it("청구 제출 후 계산 확인을 구분하고 둘 다 마치면 위탁 반영을 기다립니다", (): void => {
    const trade = invoiced();
    expect(requiresAction(trade, supplier)).toBe(true);
    expect(taskLabel(trade, supplier)).toContain("계산 결과");
    const checked = runLocalCommand(trade, supplier, { action: "approveAdjustment" });
    expect(requiresAction(checked, supplier)).toBe(false);
    expect(requiresAction(checked, buyer)).toBe(true);
    expect(taskLabel(checked, supplier)).toContain("반영을 기다립니다");
  });
  it("할 일 판단에도 거래 참여 범위를 적용합니다", (): void => {
    expect(requiresAction(calculated(), outsider)).toBe(false);
  });
  it("무관한 회사는 거래 상태와 자료에 접근하지 못합니다", (): void => {
    const trade = active();
    expect(canAccess(trade, outsider)).toBe(false);
    expect(visibleDocuments(trade, outsider)).toEqual([]);
    expect((): string => exportTradeText(trade, outsider)).toThrow("현재 회사");
    expect((): LocalTrade => runLocalCommand(trade, outsider, { action: "proposeAdjustment" })).toThrow("접근");
  });
  it("수탁기업 내부 원문은 위탁기업 목록 및 증빙 목록에 포함하지 않습니다", (): void => {
    const trade = addLocalDocument(addLocalDocument(base(), document("private"), supplier), document(), supplier);
    expect(visibleDocuments(trade, buyer)).toHaveLength(1);
    expect(visibleDocuments(trade, supplier)).toHaveLength(2);
    expect(exportTradeText(trade, buyer)).not.toContain("비밀원가.xlsx");
    expect(exportTradeText(trade, supplier)).not.toContain("비밀원가.xlsx");
    expect(exportTradeText(trade, buyer)).toContain("검토결과.pdf");
  });
  it("공유 자료가 없으면 제출 완료로 처리하지 않습니다", (): void => {
    const privateOnly = addLocalDocument(base(), document("private"), supplier);
    expect((): LocalTrade => runLocalCommand(privateOnly, supplier, { action: "submit" })).toThrow("공유 자료");
  });
  it("수탁기업은 위탁기업의 자료 요청·ERP 반영 완료를 대신 수행하지 못합니다", (): void => {
    expect((): LocalTrade => runLocalCommand(base(), supplier, { action: "request", note: "자료" })).toThrow();
    expect((): LocalTrade => runLocalCommand(calculated(), supplier, { action: "reflect" })).toThrow();
  });
  it("청구정보는 수탁기업만 제출하고 위탁기업이 덮어쓰지 못합니다", (): void => {
    expect((): LocalTrade => runLocalCommand(calculated(), buyer, { action: "submitInvoice", invoicePrice: 10400, reference: "INV1" })).toThrow();
    expect((): LocalTrade => runLocalCommand(calculated(), buyer, { action: "reflect", poPrice: 10400, invoicePrice: 10400, deliveryDate: "2026-11-16", reference: "PO1" })).toThrow("먼저 제출");
    const wrongInvoice = runLocalCommand(calculated(), supplier, { action: "submitInvoice", invoicePrice: 10000, reference: "INV1" });
    expect((): LocalTrade => runLocalCommand(wrongInvoice, buyer, { action: "reflect", poPrice: 10400, invoicePrice: 10400, deliveryDate: "2026-11-16", reference: "PO1" })).toThrow("일치하지");
  });
  it("운영 중 이행 증빙을 추가해도 이미 확정된 약정 승인은 유지합니다", (): void => {
    const trade = addLocalDocument(active(), { ...document(), kind: "청구서·세금계산서" }, supplier);
    expect(trade.buyerApproved && trade.supplierApproved).toBe(true);
    expect(trade.stage).toBe("active");
  });
  it("확정 약정에는 원문을 추가해 승인자료를 뒤바꾸지 못합니다", (): void => {
    expect((): LocalTrade => addLocalDocument(active(), document(), supplier)).toThrow("변경할 수 없습니다");
  });
});
describe("단가 계산·적용 기준", (): void => {
  it("상승·하락 경계값과 조정요건 미달을 계산합니다", (): void => {
    expect(calculateLocal(base(), 105).price).toBe(10200);
    expect(calculateLocal(base(), 95).price).toBe(9800);
    expect(calculateLocal(base(), 104.99).triggered).toBe(false);
    expect((): LocalTrade => runLocalCommand(active(), buyer, { action: "proposeAdjustment", indexValue: 103, effectiveDate: "2026-11-15", source: "지표" })).toThrow("도달하지");
  });
  it("납품일과 검수일 기준의 경계일을 구분합니다", (): void => {
    const command = { action: "reflect" as const, poPrice: 10400, invoicePrice: 10400, deliveryDate: "2026-11-14", inspectionDate: "2026-11-16", reference: "PO1" };
    expect((): LocalTrade => runLocalCommand(invoiced(), buyer, command)).toThrow("이전");
    const inspection: LocalTrade = { ...active(), terms: { ...base().terms, basis: "inspection" } };
    expect(runLocalCommand(invoiced(calculated(inspection)), buyer, command).stage).toBe("completed");
  });
  it("잘못된 숫자·날짜·반영단가를 완료로 표시하지 않습니다", (): void => {
    expect(validDate("2026-02-30")).toBe(false);
    expect((): void => validateTerms({ ...base().terms, i0: 0 })).toThrow();
    expect((): void => validateTerms({ ...base().terms, m0: 20000 })).toThrow();
    expect((): LocalTrade => runLocalCommand(invoiced(), buyer, { action: "reflect", poPrice: 10000, invoicePrice: 10400, deliveryDate: "2026-11-16", reference: "PO1" })).toThrow("일치하지");
    expect((): LocalTrade => runLocalCommand(invoiced(), buyer, { action: "reflect", poPrice: 10400, invoicePrice: 10400, deliveryDate: "2026-11-16", inspectionDate: "2026-11-15", reference: "PO1" })).toThrow("검수일");
  });
  it("CSV에서 수식처럼 해석될 수 있는 사용자 문자열을 중화합니다", (): void => {
    expect(exportPriceCsv({ ...calculated(), title: "=HYPERLINK(1)" })).toContain("'=HYPERLINK(1)");
  });
});
