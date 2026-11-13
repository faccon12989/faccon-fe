import { pct, won } from "../calc";
import { activeSupplier } from "../context";
import { readWork, saveWork, transition } from "../workflow";
import { BASE_DELIVERY_PRICE_WON, EVIDENCE_STAGE, MATERIAL_UNIT_PRICE_WON_PER_KG, SOURCE_QUANTITY_KG } from "../workflow-constants";
import { esc } from "../ui";
import type { Role, WorkAction } from "../types";

export const workButton = (action: WorkAction, label: string): string => `<button class="btn pri" data-work="${action}" data-revision="${readWork().revision}">${esc(label)}</button>`;
export const workCheck = (label: string): string => `<label class="review-check"><input type="checkbox" id="work-check"> ${esc(label)}</label>`;
export const workTrail = (contract: string): string => `<details class="card" style="margin-top:16px"><summary>이 거래의 처리 이력 (가상)</summary><ol>${readWork().log.filter((x: string): boolean => x.startsWith(contract)).map((x: string): string => `<li>${esc(x)}</li>`).join("") || "<li>아직 처리 이력이 없습니다.</li>"}</ol></details>`;

export const renewalPanel = (role: Role): string => {
  const w = readWork();
  const stage = { none: "갱신본 준비", proposed: "공급기업 확인 대기", accepted: "구매기업 최종 확인 대기", returned: "조건 재검토", active: "갱신 완료" }[w.renew];
  let action = "";
  if (role === "buyer" && ["none", "returned"].includes(w.renew)) action = `${workCheck("갱신본 v1.1과 종료 후 발주 2건의 적용 조건을 확인했습니다 (가상)")}${workButton("proposeRenew", "갱신본 제안")}`;
  if (role === "supplier" && activeSupplier() === "S-05" && w.renew === "proposed") action = `${workCheck("같은 갱신본 v1.1의 조건과 잔여 발주를 확인했습니다 (가상)")}${workButton("acceptRenew", "갱신 조건 동의")}${workButton("returnRenew", "재검토 요청")}`;
  if (role === "buyer" && w.renew === "accepted") action = `${workCheck("양사의 갱신 확인과 적용 근거를 검토했습니다 (가상)")}${workButton("confirmRenew", "갱신 확정·운영 재개")}`;
  return `<section class="card" style="margin:16px 0"><h2>ST-005 갱신 · ${stage}</h2><p>갱신본 v1.1: 유효기간 2026-11-01~2027-10-31. 기존 산식·지표·조정주기는 유지합니다. 종료 후 발주 2건은 같은 조건을 적용한다는 합의 예시입니다. 실제 법률 효력·소급 적용 여부는 담당자가 검토합니다.</p>${action || "<p>상대방 확인 후 다음 단계로 진행합니다.</p>"}<p id="work-error" role="alert"></p><p class="note">실제 문서·서명·전송 없이 동일한 갱신 조건을 양쪽 역할로 확인하는 데모입니다.</p></section>${workTrail("ST-005")}`;
};

export const evidencePanel = (role: Role): string => {
  const w = readWork();
  if (w.phase !== "active" || (role === "supplier" && activeSupplier() !== "S-04")) return "";
  const stage = ["구매기업 수정 발주 등록", "공급기업 청구 등록", "구매기업 지급근거 등록", "발주·청구·지급근거 대조 완료"][w.evidence];
  const can = (w.evidence === EVIDENCE_STAGE.pendingInvoice && role === "supplier") || (([EVIDENCE_STAGE.pendingPo, EVIDENCE_STAGE.pendingPayment] as readonly number[]).includes(w.evidence) && role === "buyer");
  const action: WorkAction = w.evidence === EVIDENCE_STAGE.pendingPo ? "po" : w.evidence === EVIDENCE_STAGE.pendingInvoice ? "invoice" : "payment";
  return `<section class="card"><h2>AL-004 · ${stage}</h2><p>2026-11 지표 100→106 · ±3% 요건 충족. 2026-12-01 이후 검수분 600개에 적용합니다. 합의된 규칙의 월별 계산에 재승인은 요구하지 않습니다.</p><p>가상 자료: PO-2612-004 → INV-2612-004 → PAY-2612-004. 지급근거 확인은 실제 송금이 아닙니다.</p>${can ? `${workCheck("현재 단계의 가상 자료에서 계약·적용기간·단가·수량을 확인했습니다")}${workButton(action, stage ?? "확인")}` : `<p>${w.evidence === EVIDENCE_STAGE.complete ? "양사가 같은 처리 결과와 증빙을 조회할 수 있습니다." : "다음 담당자의 역할로 전환하여 계속합니다."}</p>`}<p id="work-error" role="alert"></p><a class="btn" href="#/packages">증빙 요약 확인</a></section>${workTrail("AL-004")}`;
};

export const handleWork = (target: Element, role: Role, render: () => void): boolean => {
  if (target.closest("[data-work-preview]")) {
    const input = document.getElementById("work-quantity") as HTMLInputElement | null;
    const preview = document.getElementById("work-preview");
    const q = Number(input?.value);
    if (preview) {
      preview.dataset.quantity = "";
      if (!input?.value.trim() || !Number.isFinite(q) || q <= 0 || q * MATERIAL_UNIT_PRICE_WON_PER_KG > BASE_DELIVERY_PRICE_WON) preview.textContent = "0보다 크고 원재료비가 기준 납품단가 이내인 투입량을 입력해 주십시오.";
      else if (q !== SOURCE_QUANTITY_KG) preview.textContent = "가상 원문의 4kg과 입력값이 다릅니다. 원문·단위를 다시 확인해 주십시오.";
      else { preview.dataset.quantity = input.value; preview.textContent = `구매기업에 공유할 결과: 원재료비 ${won(Math.round(q * MATERIAL_UNIT_PRICE_WON_PER_KG))}/개 · 비중 ${pct(q * MATERIAL_UNIT_PRICE_WON_PER_KG / BASE_DELIVERY_PRICE_WON)}. 상세 투입량과 매입단가 원문은 구매기업 화면에서 제외합니다.`; }
    }
    return true;
  }
  const button = target.closest<HTMLElement>("[data-work]");
  if (!button) return false;
  const action = button.dataset.work as WorkAction;
  const quantity = document.getElementById("work-quantity") as HTMLInputElement | null;
  const checked = (document.getElementById("work-check") as HTMLInputElement | null)?.checked === true;
  const note = (document.getElementById("work-note") as HTMLTextAreaElement | null)?.value;
  const scope = (document.getElementById("work-scope") as HTMLSelectElement | null)?.value;
  try {
    const q = Number(quantity?.value);
    if (action === "submit" && (!quantity?.value || document.getElementById("work-preview")?.dataset.quantity !== quantity.value)) throw new Error("입력값을 바꿨다면 산정 결과 미리보기를 다시 확인해 주십시오.");
    saveWork(transition(readWork(), { action, role, supplier: activeSupplier(), revision: Number(button.dataset.revision),
      checked, m0: quantity?.value.trim() ? Math.round(q * MATERIAL_UNIT_PRICE_WON_PER_KG) : undefined, note, scope: scope === "summary" ? "summary" : "result" }));
    render();
  } catch (error) {
    const message = document.getElementById("work-error");
    if (message) message.textContent = error instanceof Error ? error.message : "입력값을 확인해 주십시오.";
  }
  return true;
};
