/* 화면 공통 헬퍼 */
import { adjust, pct } from "./calc";
import { SELF_SUPPLIER, SUPPLIERS } from "./data";
import { demoContracts } from "./demo";
import type { AdjustResult, Contract, ContractStatus, Role } from "./types";

const ESCAPES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** 템플릿 문자열에 넣기 전 모든 데이터 값을 이스케이프한다. */
export const esc = (value: unknown): string => {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
};

export const supplierName = (id: string): string => {
  return SUPPLIERS.find((s) => s.id === id)?.name ?? id;
};

export const findContract = (id: string): Contract | undefined => {
  return demoContracts().find((c) => c.id === id);
};

/** 공급기업은 자사 계약만 본다. */
export const visibleContracts = (role: Role): readonly Contract[] => {
  const contracts = demoContracts();
  return role === "supplier" ? contracts.filter((c) => c.supplier === SELF_SUPPLIER) : contracts;
};

const STATUS: Readonly<Record<ContractStatus, readonly [string, string]>> = {
  ok: ["p-ok", "운영 중"],
  draft: ["p-info", "신규 약정 준비"],
  renew: ["p-warn", "갱신 검토 필요"],
  nolink: ["p-mute", "미연동 합의"],
};

export const statusPill = (s: ContractStatus): string => {
  const [cls, label] = STATUS[s];
  return `<span class="pill ${cls}">${label}</span>`;
};

export const adjustPill = (r: AdjustResult): string => {
  if (!r.triggered) return `<span class="pill p-mute">요건 미충족</span>`;
  return r.diffPerUnit > 0
    ? `<span class="pill p-bad">지표 상승 ${pct(r.rate)}</span>`
    : `<span class="pill p-info">지표 하락 ${pct(r.rate)}</span>`;
};

/** 이번(11월 지표) 조정이 실제로 적용되는 날짜. 데모 기준 지표월은 2026년 11월. */
export const applyFrom = (applyDay: string): string => {
  if (applyDay.startsWith("익월")) return `2026년 12월 1일 ${applyDay.includes("검수") ? "검수분" : "발주분"}부터`;
  if (applyDay.startsWith("분기")) return `2027년 1월 1일 ${applyDay.includes("검수") ? "검수분" : "발주분"}부터`;
  return applyDay;
};

export const pill = (cls: string, label: string): string => {
  return `<span class="pill ${cls}">${esc(label)}</span>`;
};

export { adjust };
