/* 화면 공통 헬퍼 */
import { adjust, pct } from "./calc";
import { CONTRACTS, SELF_SUPPLIER, SUPPLIERS } from "./data";
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
  return CONTRACTS.find((c) => c.id === id);
};

/** 공급기업은 자사 계약만 본다. */
export const visibleContracts = (role: Role): readonly Contract[] => {
  return role === "supplier" ? CONTRACTS.filter((c) => c.supplier === SELF_SUPPLIER) : CONTRACTS;
};

const STATUS: Readonly<Record<ContractStatus, readonly [string, string]>> = {
  ok: ["p-ok", "운영 중"],
  draft: ["p-info", "신규 약정 준비"],
  renew: ["p-warn", "갱신 검토 필요"],
};

export const statusPill = (s: ContractStatus): string => {
  const [cls, label] = STATUS[s];
  return `<span class="pill ${cls}">${label}</span>`;
};

export const adjustPill = (r: AdjustResult): string => {
  if (!r.triggered) return `<span class="pill p-mute">요건 미충족</span>`;
  return r.diffPerUnit > 0
    ? `<span class="pill p-bad">인상 ${pct(r.rate)}</span>`
    : `<span class="pill p-info">인하 ${pct(r.rate)}</span>`;
};

export const pill = (cls: string, label: string): string => {
  return `<span class="pill ${cls}">${esc(label)}</span>`;
};

export { adjust };
