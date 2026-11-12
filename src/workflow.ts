import type { WorkState, WorkCommand } from "./types";
const KEY = "faccon-work-v1";
export const EMPTY_WORK: WorkState = { phase: "draft", revision: 0, m0: 11200, scope: "result", note: "", renew: "none", evidence: 0, log: [] };
export const readWork = (): WorkState => {
  try {
    const x: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (typeof x !== "object" || x === null) return EMPTY_WORK;
    const s = x as Record<string, unknown>;
    if (!["draft", "requested", "submitted", "returned", "active"].includes(String(s.phase))
      || !["none", "proposed", "accepted", "returned", "active"].includes(String(s.renew))
      || typeof s.m0 !== "number" || !Number.isFinite(s.m0) || s.m0 <= 0 || s.m0 > 22000
      || typeof s.revision !== "number" || !Number.isInteger(s.revision) || s.revision < 0
      || typeof s.evidence !== "number" || !Number.isInteger(s.evidence) || s.evidence < 0 || s.evidence > 3
      || !["result", "summary"].includes(String(s.scope)) || typeof s.note !== "string"
      || !Array.isArray(s.log) || !s.log.every((v: unknown): boolean => typeof v === "string")) return EMPTY_WORK;
    return { phase: s.phase as WorkState["phase"], renew: s.renew as WorkState["renew"], m0: s.m0, revision: s.revision,
      evidence: s.phase === "active" ? s.evidence : 0, scope: s.scope as WorkState["scope"], note: s.note, log: s.log };
  } catch { return EMPTY_WORK; }
};
/** 가상 역할별 상태 전이. 실제 권한 검사는 서버에서 별도로 구현합니다. */
export const transition = (s: WorkState, c: WorkCommand): WorkState => {
  if (c.revision !== s.revision) throw new Error("다른 화면에서 변경됐습니다. 새로고침 후 최신 버전을 확인해 주십시오.");
  const buyer = c.role === "buyer";
  const supplier = c.role === "supplier" && c.supplier === "S-04";
  const renewSupplier = c.role === "supplier" && c.supplier === "S-05";
  let patch: Partial<WorkState> | null = null;
  let message = "";
  if (c.action === "request" && buyer && s.phase === "draft") { patch = { phase: "requested" }; message = "AL-004 구매기업: 투입량 보완 요청"; }
  if (c.action === "submit" && supplier && ["requested", "returned"].includes(s.phase) && c.checked && c.m0 !== undefined && Number.isFinite(c.m0) && c.m0 > 0 && c.m0 <= 22000) {
    patch = { phase: "submitted", m0: c.m0, scope: c.scope ?? "result", note: "" }; message = "AL-004 공급기업: 산정 결과·규칙 승인 및 제출";
  }
  if (c.action === "return" && buyer && s.phase === "submitted" && c.note?.trim()) { patch = { phase: "returned", note: c.note.trim().slice(0, 300) }; message = "AL-004 구매기업: 보완 요청 (이전 제출 승인 무효)"; }
  if (c.action === "approve" && buyer && s.phase === "submitted" && c.checked) { patch = { phase: "active" }; message = "AL-004 구매기업: 같은 제출 버전 확인·운영 시작"; }
  if (c.action === "proposeRenew" && buyer && ["none", "returned"].includes(s.renew) && c.checked) { patch = { renew: "proposed" }; message = "ST-005 구매기업: 갱신본 v1.1 제안·잔여 발주 2건 반영 확인"; }
  if (c.action === "acceptRenew" && renewSupplier && s.renew === "proposed" && c.checked) { patch = { renew: "accepted" }; message = "ST-005 공급기업: 갱신본 v1.1 확인"; }
  if (c.action === "returnRenew" && renewSupplier && s.renew === "proposed") { patch = { renew: "returned" }; message = "ST-005 공급기업: 갱신 조건 재검토 요청"; }
  if (c.action === "confirmRenew" && buyer && s.renew === "accepted" && c.checked) { patch = { renew: "active" }; message = "ST-005 구매기업: 갱신 근거 확인·운영 재개"; }
  if (s.phase === "active" && c.checked && c.action === "po" && buyer && s.evidence === 0) { patch = { evidence: 1 }; message = "AL-004 구매기업: 수정 발주 등록"; }
  if (s.phase === "active" && c.checked && c.action === "invoice" && supplier && s.evidence === 1) { patch = { evidence: 2 }; message = "AL-004 공급기업: 청구 등록"; }
  if (s.phase === "active" && c.checked && c.action === "payment" && buyer && s.evidence === 2) { patch = { evidence: 3 }; message = "AL-004 구매기업: 지급근거 등록 (가상)"; }
  if (!patch) throw new Error("현재 역할·회사·처리 순서와 확인 항목을 확인해 주십시오.");
  return { ...s, ...patch, revision: s.revision + 1, log: [...s.log, message] };
};
export const saveWork = (s: WorkState): void => localStorage.setItem(KEY, JSON.stringify(s));
export const resetWork = (): void => saveWork(EMPTY_WORK);
