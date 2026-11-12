/* 해시 라우팅과 이벤트 연결 */
import "./styles.css";
import "./workflow.css";
import { adjust } from "./calc";
import { BUYER, SELF_SUPPLIER, TODOS } from "./data";
import { nextEvidence, readDemo, requestTask, resetDemo, saveDemo, taskDone } from "./demo";
import { downloadEvidence } from "./evidence";
import { handleReview, reviewView } from "./views/review";
import type { AppState, Role } from "./types";
import { esc, findContract, supplierName } from "./ui";
import { contractDetailView, contractsView, resultBlock } from "./views/contracts";
import { dashboardView } from "./views/dashboard";
import { packagesView, reconcileView, requestsView } from "./views/operations";
import { settlementView, syncSettlement } from "./views/settlement";

type Page = "review" | "dashboard" | "contracts" | "reconcile" | "requests" | "packages" | "settlement";

interface NavItem {
  href: string;
  label: string;
  count?: () => number;
}

const NAV: readonly (NavItem | "sep")[] = [
  { href: "#/dashboard", label: "운영 현황", count: (): number => TODOS.filter((t): boolean => !taskDone(t.code)).length },
  { href: "#/contracts", label: "연동약정" },
  { href: "#/review", label: "신규 약정 검토" },
  { href: "#/reconcile", label: "반영 대조" },
  { href: "#/requests", label: "자료 요청·공유" },
  { href: "#/packages", label: "제출 패키지" },
  "sep",
  { href: "#/settlement", label: "차액 지급 시뮬레이션" },
];

const TITLES: Readonly<Record<Page, string>> = {
  review: "신규 약정 검토", dashboard: "운영 현황", contracts: "연동약정", reconcile: "반영 대조",
  requests: "자료 요청·공유", packages: "제출 패키지", settlement: "차액 정산 실증",
};

const PAGES = Object.keys(TITLES) as Page[];
const TOAST_MS = 2200;

let state: AppState = { role: "buyer", deposited: readDemo().deposited, paid: readDemo().paid };
let toastTimer: number | undefined;

const setState = (patch: Partial<AppState>): void => {
  state = { ...state, ...patch };
};

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} 요소가 없습니다`);
  return node as T;
};

const parseHash = (): { page: Page; id?: string } => {
  const [, raw = "dashboard", id] = (location.hash || "#/dashboard").split("/");
  const page = PAGES.includes(raw as Page) ? (raw as Page) : "dashboard";
  return id ? { page, id: decodeURIComponent(id) } : { page };
};

const renderNav = (active: Page): void => {
  el("nav").innerHTML = NAV.map((item) => {
    if (item === "sep") return `<div class="sep">독립 실증</div>`;
    const on = item.href.slice(2) === active;
    const badge = item.count && state.role === "buyer" ? `<span class="cnt">${item.count()}</span>` : "";
    return `<a href="${item.href}" class="${on ? "on" : ""}" ${on ? 'aria-current="page"' : ""}><span>${item.label}</span>${badge}</a>`;
  }).join("");
};

const renderPage = (page: Page, id: string | undefined, role: Role): string => {
  switch (page) {
    case "contracts": return id ? contractDetailView(role, id) : contractsView(role);
    case "reconcile": return reconcileView(role);
    case "requests": return requestsView(role);
    case "packages": return packagesView(role);
    case "review": return role === "buyer" ? reviewView() : `<section class="card"><h1>구매기업의 신규 거래 검토</h1><p>자사에 공유된 거래는 연동약정 메뉴에서 확인해 주세요.</p></section>`;
    case "settlement": return role === "buyer" ? settlementView() : `<section class="card"><h1>지급 시뮬레이션</h1><p>실행은 구매기업 역할에서 체험할 수 있습니다. 실제 송금은 발생하지 않습니다.</p></section>`;
    default: return dashboardView(role);
  }
};

const route = (): void => {
  const { page, id } = parseHash();
  const view = el("view");
  view.innerHTML = renderPage(page, id, state.role);
  renderNav(page);
  const company = state.role === "buyer" ? BUYER.name : supplierName(SELF_SUPPLIER);
  el("crumbs").innerHTML = `${esc(company)} / <b>${esc(TITLES[page])}${id ? ` · ${esc(id)}` : ""}</b>`;
  el("company-panel").innerHTML = `<small>${state.role === "buyer" ? "구매기업" : "공급기업"}</small><b>${esc(company)}</b><small>가상 역할 전환 · 실제 로그인 아님</small>`;
  if (page === "settlement") syncSettlement(state);
  view.focus({ preventScroll: true });
  window.scrollTo(0, 0);
};

const toast = (message: string): void => {
  const t = el("toast");
  t.textContent = message;
  t.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove("show"), TOAST_MS);
};

const switchRole = (role: Role, button: HTMLElement): void => {
  setState({ role });
  document.querySelectorAll<HTMLElement>("[data-role]").forEach((b) => b.classList.toggle("on", b === button));
  toast(role === "supplier" ? "공급기업(동양알루텍) 화면으로 전환했습니다" : "구매기업(A정밀) 화면으로 전환했습니다");
  route();
};

document.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;

  if (target.closest("[data-reset]")) {
    if (window.confirm("이 브라우저의 가상 요청·반영·약정 확인 상태를 초기화할까요?")) { resetDemo(); setState({ deposited: false, paid: false }); route(); }
    return;
  }
  if (target.closest("[data-export-csv]")) { downloadEvidence(state.role); return; }
  if (target.closest("[data-print]")) { window.print(); return; }
  if (state.role === "buyer") {
    if (handleReview(target, route)) return;
    if (target.closest("[data-request-po]")) { requestTask("C-102", "ERP", "구매팀 ERP 담당자 (가상)"); route(); toast("수정 요청을 기록했습니다. 반영 대기 상태입니다."); return; }
    if (target.closest("[data-next-evidence]")) { saveDemo(nextEvidence(readDemo())); route(); return; }
  }
  const roleBtn = target.closest<HTMLElement>("[data-role]");
  if (roleBtn) {
    const role = roleBtn.dataset.role;
    if (role === "buyer" || role === "supplier") switchRole(role, roleBtn);
    return;
  }
  const row = target.closest<HTMLElement>("[data-go]");
  if (row?.dataset.go) { location.hash = row.dataset.go; return; }
  const toastBtn = target.closest<HTMLElement>("[data-toast]");
  if (toastBtn?.dataset.toast) { toast(toastBtn.dataset.toast); return; }

  if (target.id === "btn-deposit" && state.role === "buyer" && !state.deposited) {
    saveDemo({ deposited: true });
    setState({ deposited: true });
    syncSettlement(state);
    toast("가상 예치 상태를 저장했습니다. 실제 체인 거래는 없습니다.");
  } else if (target.id === "btn-pay" && state.role === "buyer" && state.deposited && !state.paid && (document.getElementById("pay-consent") as HTMLInputElement | null)?.checked) {
    saveDemo({ paid: true });
    setState({ paid: true });
    syncSettlement(state);
    toast("시뮬레이션 완료. 같은 지급명세의 재실행을 차단합니다.");
  }
});

document.addEventListener("input", (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || input.id !== "it") return;
  const c = findContract(input.dataset.contract ?? "");
  if (!c) return;
  const it = Number(input.value);
  el("it-out").textContent = String(it);
  el("f-it").textContent = String(it);
  el("calc-result").innerHTML = resultBlock(c, adjust(c, it));
});

document.addEventListener("change", (e: Event): void => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (input.id === "pay-consent") syncSettlement(state);
  if (input.id === "review-source") {
    const button = document.querySelector<HTMLButtonElement>("[data-review-approve]");
    if (button) button.disabled = !input.checked;
  }
});
window.addEventListener("storage", (): void => { setState({ deposited: readDemo().deposited, paid: readDemo().paid }); route(); });
window.addEventListener("hashchange", route);
route();
