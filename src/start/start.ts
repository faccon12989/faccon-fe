import "../my/local.css";
import { requireSession, saveLocalTrade } from "../local-store";
import { validateTerms } from "../local-workflow";
import { won } from "../calc";
import { esc } from "../ui";
import { input, notice } from "../my/local-shell";
import type { LocalTerms, LocalTrade } from "../types";

const session = requireSession();
if (session?.role === "supplier") location.replace("./my.html#/trades");
const root = document.getElementById("registration");
let step = 0;
let draft: Readonly<Record<string, string>> = { entry: "new", buyer: session?.company ?? "", supplier: "", title: "", material: "", p0: "", m0: "", i0: "", threshold: "5", qty: "", indexName: "", cycle: "매월", basis: "delivery", effectiveDate: "" };
const termsFromDraft = (): LocalTerms => ({ p0: Number(draft.p0), m0: Number(draft.m0), i0: Number(draft.i0), threshold: Number(draft.threshold), qty: Number(draft.qty), indexName: draft.indexName?.trim() ?? "", cycle: draft.cycle ?? "매월", basis: draft.basis === "inspection" ? "inspection" : "delivery", effectiveDate: draft.effectiveDate ?? "" });
const basics = (): string => `<h2>어떤 거래를 등록하시겠습니까?</h2><p>거래명과 상대 기업을 입력합니다. 등록한 정보가 이후 모든 업무에 연결됩니다.</p><div class="fd-form"><fieldset class="fd-role-select"><legend>등록 유형</legend><label><input type="radio" name="entry" value="new" ${draft.entry === "new" ? "checked" : ""}>신규 약정 준비</label><label><input type="radio" name="entry" value="existing" ${draft.entry === "existing" ? "checked" : ""}>기존 연동약정 등록</label></fieldset><div class="fd-form-grid">${input("위탁기업", "buyer", "text", draft.buyer ?? "", "readonly")}${input("수탁기업", "supplier", "text", draft.supplier ?? "", 'required maxlength="80" placeholder="상대 기업 로그인에 사용할 정확한 회사명"')}${input("거래 품목", "title", "text", draft.title ?? "", 'required maxlength="120" placeholder="예: 알루미늄 하우징 A-01"')}${input("대상 원재료", "material", "text", draft.material ?? "", 'required maxlength="80" placeholder="예: 알루미늄"')}</div></div>`;
const conditions = (): string => `<h2>약정 조건을 입력합니다</h2><p>기존 약정 내용 또는 양사가 검토할 초안을 입력합니다. 입력한 값으로 단가를 계산합니다.</p><div class="fd-form"><div class="fd-form-grid">${input("기준 납품단가 (원/개)", "p0", "number", draft.p0 ?? "", 'required min="1" step="1" placeholder="예: 10000"')}${input("제품당 원재료비 (원/개)", "m0", "number", draft.m0 ?? "", 'required min="0.01" step="any" placeholder="예: 4000"')}${input("기준지표 이름", "indexName", "text", draft.indexName ?? "", 'required maxlength="150" placeholder="예: 양사가 합의한 알루미늄 월평균 지표"')}${input("기준지표 값", "i0", "number", draft.i0 ?? "", 'required min="0.0001" step="any" placeholder="예: 100"')}${input("조정요건 (±%)", "threshold", "number", draft.threshold ?? "5", 'required min="0.01" step="any"')}${input("대상 수량 (개)", "qty", "number", draft.qty ?? "", 'required min="1" step="1" placeholder="예: 1000"')}<label class="fd-field"><span>조정주기</span><select name="cycle">${["매월", "매분기", "반기", "매년"].map((cycle: string): string => `<option ${draft.cycle === cycle ? "selected" : ""}>${cycle}</option>`).join("")}</select></label><label class="fd-field"><span>조정단가 적용 기준</span><select name="basis"><option value="delivery" ${draft.basis === "delivery" ? "selected" : ""}>납품일 기준</option><option value="inspection" ${draft.basis === "inspection" ? "selected" : ""}>검수일 기준</option></select></label>${input("약정 적용 시작일", "effectiveDate", "date", draft.effectiveDate ?? "", "required")}</div>${notice("산식: 기준 납품단가 + 제품당 원재료비 × (비교지표 − 기준지표) ÷ 기준지표. 원 단위 반올림합니다. 적용 기준은 납품일과 검수일 중 실제 약정에 맞게 선택합니다.")}</div>`;
const review = (): string => {
  const terms = termsFromDraft();
  return `<h2>등록 내용을 확인합니다</h2><p>등록한 뒤 같은 거래에서 자료 준비와 양사 확인을 이어갑니다.</p><div class="fd-review-grid"><div><h3>거래 정보</h3><p>${esc(draft.buyer)} ↔ ${esc(draft.supplier)}</p><p>${esc(draft.title)} · ${esc(draft.material)}</p><p>${draft.entry === "existing" ? "기존 연동약정 등록" : "신규 약정 준비"}</p></div><div><h3>약정 조건</h3><p>기준단가 ${esc(won(terms.p0))} / 원재료비 ${esc(won(terms.m0))}</p><p>${esc(terms.indexName)} · 기준값 ${terms.i0}</p><p>±${terms.threshold}% / ${esc(terms.cycle)} / ${terms.qty.toLocaleString("ko-KR")}개</p><p>${terms.basis === "delivery" ? "납품일" : "검수일"} 기준 · ${esc(terms.effectiveDate)}부터</p></div></div><label class="fd-check"><input type="checkbox" name="confirmed" required>거래 당사자와 약정 조건을 확인했습니다.</label>${notice(draft.entry === "existing" ? "기존 약정은 양사가 등록 조건을 확인하면 운영을 시작합니다. 원문은 등록 후 거래 자료에 보관할 수 있습니다." : "신규 약정은 자료 요청·제출과 양사 조건 확인을 거칩니다. 입력한 조건은 양사가 승인하기 전까지 검토 초안으로 관리합니다.")}`;
};
const render = (): void => {
  if (!root || !session || session.role !== "buyer") return;
  root.innerHTML = `<p class="fd-eyebrow">NEW AGREEMENT</p><h1>새로운 거래 등록</h1><ol class="fd-start-stepper">${["01 거래 정보", "02 약정 조건", "03 확인·등록"].map((name: string, index: number): string => `<li class="${index === step ? "on" : ""}">${esc(name)}</li>`).join("")}</ol><form id="registration-form" class="fd-start-card">${step === 0 ? basics() : step === 1 ? conditions() : review()}<p class="fd-error" id="registration-error" role="alert"></p><div class="fd-start-actions">${step > 0 ? '<button type="button" class="fd-button" data-back>← 이전</button>' : '<a href="./my.html" class="fd-button">취소</a>'}<button class="fd-button primary" type="submit">${step === 2 ? "거래 등록하기" : "다음 단계 →"}</button></div></form>`;
};
const collect = (form: HTMLFormElement): void => {
  const data = new FormData(form);
  const fields = Object.fromEntries([...data.entries()].filter((entry: [string, FormDataEntryValue]): boolean => typeof entry[1] === "string"));
  draft = { ...draft, ...fields } as Readonly<Record<string, string>>;
};
document.addEventListener("click", (event: MouseEvent): void => {
  if (!(event.target instanceof Element) || !event.target.closest("[data-back]")) return;
  const form = document.querySelector<HTMLFormElement>("#registration-form");
  if (form) collect(form);
  step = Math.max(0, step - 1); render();
});
document.addEventListener("submit", (event: SubmitEvent): void => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== "registration-form" || !session || session.role !== "buyer") return;
  event.preventDefault(); collect(form);
  try {
    if (step === 0 && (!draft.title?.trim() || !draft.supplier?.trim() || !draft.material?.trim())) throw new Error("거래 품목, 수탁기업, 원재료를 입력해 주세요.");
    if (draft.buyer?.trim() === draft.supplier?.trim()) throw new Error("위탁기업과 수탁기업은 서로 다른 회사로 입력해 주세요.");
    if (step > 0) validateTerms(termsFromDraft());
    if (step < 2) { step += 1; render(); window.scrollTo(0, 0); return; }
    const id = `T-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const trade: LocalTrade = { id, title: draft.title?.trim() ?? "", buyer: session.company, supplier: draft.supplier?.trim() ?? "", material: draft.material?.trim() ?? "", entry: draft.entry === "existing" ? "existing" : "new", createdAt: new Date().toISOString(), terms: termsFromDraft(), stage: "draft", request: "", buyerApproved: false, supplierApproved: false, documents: [], adjustmentHistory: [], events: [{ id: crypto.randomUUID(), at: new Date().toISOString(), actor: session.company, role: session.role, action: "거래 등록", detail: draft.entry === "existing" ? "기존 약정 조건을 등록했습니다." : "신규 약정 초안을 등록했습니다." }] };
    saveLocalTrade(trade);
    location.href = `./my.html#/trade/${encodeURIComponent(id)}`;
  } catch (error: unknown) {
    const node = document.getElementById("registration-error");
    if (node) node.textContent = error instanceof Error ? error.message : "거래를 저장하지 못했습니다. 브라우저 저장공간을 확인해 주세요.";
  }
});
render();
