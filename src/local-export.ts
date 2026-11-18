import { won, pct } from "./calc";
import { calculateLocal, canAccess, STAGE_LABEL, visibleDocuments } from "./local-workflow";
import type { LocalAdjustment, LocalDocument, LocalEvent, LocalSession, LocalTrade } from "./types";

export const exportTradeText = (trade: LocalTrade, session: LocalSession): string => {
  if (!canAccess(trade, session)) throw new Error("현재 회사의 증빙만 내려받을 수 있습니다.");
  const { terms: t, adjustment: a } = trade;
  const result = a ? calculateLocal(trade, a.indexValue) : null;
  const docs = visibleDocuments(trade, session).filter((doc: LocalDocument): boolean => doc.scope === "shared");
  const lines = [
    "FACCON 거래·단가 조정 증빙 목록", `생성일: ${new Date().toLocaleString("ko-KR")}`, "",
    `거래번호: ${trade.id}`, `품목: ${trade.title}`, `위탁기업: ${trade.buyer}`, `수탁기업: ${trade.supplier}`,
    `상태: ${STAGE_LABEL[trade.stage]}`, `원재료: ${trade.material}`, "",
    "[약정 조건]", `기준 납품단가: ${won(t.p0)} / 제품당 원재료비: ${won(t.m0)}`, `기준지표: ${t.indexName} / 기준값: ${t.i0}`,
    `조정요건: ±${t.threshold}% / 조정주기: ${t.cycle}`, `적용 기준: ${t.basis === "delivery" ? "납품일" : "검수일"} / 약정 적용 시작일: ${t.effectiveDate}`,
    "산식: 기준 납품단가 + 제품당 원재료비 × (비교지표 - 기준지표) ÷ 기준지표 (원 단위 반올림)",
    `약정 확인: 위탁 ${trade.buyerApproved ? "완료" : "대기"} / 수탁 ${trade.supplierApproved ? "완료" : "대기"}`, "",
    ...(a && result ? ["[단가 조정]", `조정 ${a.revision}차 / 비교지표: ${a.indexValue} / 변동률: ${pct(result.rate)}`, `지표 확인 근거: ${a.source}`, `조정단가: ${won(result.price)} / 반영일: ${a.effectiveDate}`, `계산 결과 확인 (재승인 아님): 위탁 ${a.buyerApproved ? "확인" : "미확인"} / 수탁 ${a.supplierApproved ? "확인" : "미확인"}`, `발주서 단가: ${won(a.poPrice)} / 청구서 단가: ${won(a.invoicePrice)}`, `발주서 참조: ${a.reference ?? "미입력"}`, `수탁기업 청구서 참조: ${a.invoiceReference ?? "미제출"} / 제출일시: ${a.invoiceSubmittedAt ?? "미제출"}`, `납품일: ${a.deliveryDate ?? "미입력"} / 검수일: ${a.inspectionDate ?? "미입력"}`, ""] : []),
    "[공유 원문 목록 — 원문은 화면에서 별도 내려받기]", ...docs.map((doc: LocalDocument): string => `${doc.kind} | ${doc.name} | ${doc.owner} | ${doc.uploadedAt}`), "",
    "[이전 조정 이력]", ...(trade.adjustmentHistory ?? []).map((row: LocalAdjustment): string => `조정 ${row.revision}차 | 비교지표 ${row.indexValue} | 단가 ${won(calculateLocal(trade, row.indexValue).price)} | 반영일 ${row.effectiveDate} | 발주·청구 ${row.reference ?? ""} | 출처 ${row.source}`), "",
    "[업무 확인 이력]", ...trade.events.map((event: LocalEvent): string => `${event.at} | ${event.actor} | ${event.action} | ${event.detail}`), "",
    "본 목록은 등록자료와 담당자 확인 내역을 정리한 업무 보조자료입니다. 전문기관 확인서, 정부 접수증 또는 블록체인 인증서를 대신하지 않습니다.",
    "회사 내부 보관 자료는 이 목록에 포함하지 않습니다.",
  ];
  return lines.join("\n");
};
export const exportPriceCsv = (trade: LocalTrade): string => {
  const a = trade.adjustment;
  if (!a || !["ready", "completed"].includes(trade.stage)) throw new Error("확정 약정으로 계산한 후 ERP 반영 파일을 내려받을 수 있습니다.");
  const csvValue = (value: string | number): string => `"${String(value).replace(/^[=+\-@]/, "'$&").replaceAll('"', '""')}"`;
  return "\uFEFF" + [
    ["거래번호", "품목", "위탁기업", "수탁기업", "기준단가", "조정단가", "반영일", "적용기준", "조정차수"],
    [trade.id, trade.title, trade.buyer, trade.supplier, trade.terms.p0, calculateLocal(trade, a.indexValue).price, a.effectiveDate, trade.terms.basis === "delivery" ? "납품일" : "검수일", a.revision],
  ].map((row: readonly (string | number)[]): string => row.map(csvValue).join(",")).join("\r\n");
};
