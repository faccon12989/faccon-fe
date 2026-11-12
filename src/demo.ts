/* 브라우저 안에서만 공유하는 가상 시나리오. 실제 권한·서명·ERP 연동은 수행하지 않는다. */
import { CONTRACTS, RECONCILE } from "./data";
import { readWork, resetWork } from "./workflow";
import { adjust } from "./calc";
import type { Contract, DemoState, ReconcileRow, TaskRequest } from "./types";

const KEY = "faccon-demo-v2";
export const EMPTY_DEMO: Readonly<DemoState> = {
  version: 2, requests: [], po: false, invoice: false, payment: false,
  setup: null, draftApproved: false, draftM0: 11200, deposited: false, paid: false,
};

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;
const isRequest = (x: unknown): x is TaskRequest => isRecord(x)
  && typeof x.id === "string" && ["C-101", "C-102", "C-103"].includes(x.id)
  && typeof x.choice === "string" && typeof x.detail === "string";
export const parseDemo = (raw: string | null): DemoState => {
  try {
    const x: unknown = JSON.parse(raw ?? "null");
    if (!isRecord(x) || x.version !== 2 || !Array.isArray(x.requests) || !x.requests.every(isRequest)
      || ![x.po, x.invoice, x.payment, x.draftApproved, x.deposited, x.paid].every((v: unknown): boolean => typeof v === "boolean")
      || ![null, "A", "B"].includes(x.setup as null | string)
      || typeof x.draftM0 !== "number" || !Number.isFinite(x.draftM0) || x.draftM0 <= 0 || x.draftM0 > 22000) return { ...EMPTY_DEMO };
    return { ...EMPTY_DEMO, requests: x.requests, po: x.po === true,
      invoice: x.po === true && x.invoice === true, payment: x.po === true && x.invoice === true && x.payment === true,
      setup: x.setup === "A" || x.setup === "B" ? x.setup : null,
      draftApproved: x.draftApproved === true, draftM0: x.draftM0,
      deposited: x.deposited === true, paid: x.deposited === true && x.paid === true };
  } catch { return { ...EMPTY_DEMO }; }
};
export const readDemo = (): DemoState => {
  try { return parseDemo(localStorage.getItem(KEY)); } catch { return { ...EMPTY_DEMO }; }
};
export const saveDemo = (patch: Partial<DemoState>): void => {
  const next = { ...readDemo(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); }
  catch { throw new Error("브라우저 저장 공간에 접근할 수 없습니다. 저장을 허용한 뒤 다시 시도해 주십시오."); }
};
export const resetDemo = (): void => { saveDemo(EMPTY_DEMO); resetWork(); };

export const demoContracts = (_s: DemoState = readDemo()): readonly Contract[] => {
  const w = readWork();
  return CONTRACTS.map((c: Contract): Contract => {
    if (c.id === "AL-004" && w.phase === "active") return { ...c, m0: w.m0, material: "알루미늄 합금 (공유 승인한 산정 결과)", status: "ok", stepNow: w.evidence === 3 ? 8 : 6, version: "v1.0 (양사 데모 확인)" };
    if (c.id === "ST-005" && w.renew === "active") return { ...c, status: "ok", end: "2027-10-31", version: "v1.1 (갱신 데모)", stepNow: 5 };
    return c;
  });
};

export const demoRows = (s: DemoState = readDemo()): readonly ReconcileRow[] => {
  const w = readWork();
  const c = demoContracts().find((x: Contract): boolean => x.id === "AL-004");
  const extra: readonly ReconcileRow[] = w.phase === "active" && c ? [{ contract: "AL-004", po: "PO-2612-004", poPrice: w.evidence >= 1 ? adjust(c).price : c.p0, invPrice: w.evidence >= 2 ? adjust(c).price : null, qty: c.qty, paid: w.evidence === 3 }] : [];
  return [...RECONCILE.map((row: ReconcileRow): ReconcileRow => {
  const c = CONTRACTS.find((item: Contract): boolean => item.id === row.contract);
  if (row.contract !== "AL-001" || !c) return row;
  const price = adjust(c).price;
  return { ...row, poPrice: s.po ? price : row.poPrice, invPrice: s.invoice ? price : null, paid: s.payment };
}), ...extra];
};

export const requestTask = (id: string, choice: string, detail: string): void => {
  const s = readDemo();
  saveDemo({ requests: [...s.requests.filter((r: TaskRequest): boolean => r.id !== id), { id, choice, detail }] });
};
export const taskStatus = (id: string, s: DemoState = readDemo()): string => {
  if (id === "C-101" && readWork().renew === "active") return "갱신 확인 완료";
  if (id === "C-103" && readWork().phase === "active") return "보완·약정 확인 완료";
  if (id === "C-103" && readWork().phase === "submitted") return "공급기업 제출 · 구매기업 확인 대기";
  if (id === "C-103" && readWork().phase === "requested") return "보완자료 회신 대기";
  if (id === "C-103" && readWork().phase === "returned") return "보완 후 재제출 대기";
  if (id === "C-102" && s.po) return "발주 반영 확인 완료";

  const q = s.requests.find((r: TaskRequest): boolean => r.id === id);
  if (!q) return "확인 필요";
  if (id === "C-101") return q.choice === "end" ? "잔여 발주 확인 대기" : q.choice === "check" ? "계약 담당자 회신 대기" : "갱신본·서명 확인 대기";
  return id === "C-102" ? "ERP 반영 대기" : "보완자료 회신 대기";
};
export const taskDone = (id: string, s: DemoState = readDemo()): boolean =>
  (id === "C-102" && s.po) || (id === "C-103" && readWork().phase === "active") || (id === "C-101" && readWork().renew === "active");

/** 단계는 실제 근거별로 판정한다. 청구가 일치해도 발주 불일치는 사라지지 않는다. */
export const reconcileChecks = (row: ReconcileRow, c: Contract): readonly boolean[] => {
  const price = adjust(c).price;
  return [c.status === "ok", row.poPrice === price, row.invPrice === price, row.paid];
};
export const nextEvidence = (s: DemoState): Partial<DemoState> =>
  !s.po ? { po: true } : !s.invoice ? { invoice: true } : !s.payment ? { payment: true } : {};
