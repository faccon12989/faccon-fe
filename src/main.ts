/* 해시 라우팅과 이벤트 연결 */
import "./styles.css";
import { adjust } from "./calc";
import { TODOS } from "./data";
import type { AppState, Role } from "./types";
import { findContract } from "./ui";
import { contractDetailView, contractsView, resultBlock } from "./views/contracts";
import { dashboardView } from "./views/dashboard";
import { packagesView, reconcileView, requestsView } from "./views/operations";
import { settlementView, syncSettlement } from "./views/settlement";

type Page = "dashboard" | "contracts" | "reconcile" | "requests" | "packages" | "settlement";

interface NavItem {
  href: string;
  label: string;
  count?: () => number;
}

const NAV: readonly (NavItem | "sep")[] = [
  { href: "#/dashboard", label: "운영 현황", count: () => TODOS.length },
  { href: "#/contracts", label: "연동약정" },
  { href: "#/reconcile", label: "반영 대조" },
  { href: "#/requests", label: "자료 요청·공유" },
  { href: "#/packages", label: "제출 패키지" },
  "sep",
  { href: "#/settlement", label: "차액 정산 (테스트넷)" },
];

const TITLES: Readonly<Record<Page, string>> = {
  dashboard: "운영 현황", contracts: "연동약정", reconcile: "반영 대조",
  requests: "자료 요청·공유", packages: "제출 패키지", settlement: "차액 정산 실증",
};

const PAGES = Object.keys(TITLES) as Page[];
const TOAST_MS = 2200;

let state: AppState = { role: "buyer", deposited: false, paid: false };
let toastTimer: number | undefined;

function setState(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
}

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} 요소가 없습니다`);
  return node as T;
}

function parseHash(): { page: Page; id?: string } {
  const [, raw = "dashboard", id] = (location.hash || "#/dashboard").split("/");
  const page = PAGES.includes(raw as Page) ? (raw as Page) : "dashboard";
  return id ? { page, id: decodeURIComponent(id) } : { page };
}

function renderNav(active: Page): void {
  el("nav").innerHTML = NAV.map((item) => {
    if (item === "sep") return `<div class="sep">독립 실증</div>`;
    const on = item.href.slice(2) === active;
    const badge = item.count && state.role === "buyer" ? `<span class="cnt">${item.count()}</span>` : "";
    return `<a href="${item.href}" class="${on ? "on" : ""}" ${on ? 'aria-current="page"' : ""}><span>${item.label}</span>${badge}</a>`;
  }).join("");
}

function renderPage(page: Page, id: string | undefined, role: Role): string {
  switch (page) {
    case "contracts": return id ? contractDetailView(role, id) : contractsView(role);
    case "reconcile": return reconcileView(role);
    case "requests": return requestsView(role);
    case "packages": return packagesView(role);
    case "settlement": return settlementView();
    default: return dashboardView(role);
  }
}

function route(): void {
  const { page, id } = parseHash();
  const view = el("view");
  view.innerHTML = renderPage(page, id, state.role);
  renderNav(page);
  el("crumbs").innerHTML = `A정밀 (가상) / <b>${TITLES[page]}${id ? " · " + id.replace(/[<>&"]/g, "") : ""}</b>`;
  if (page === "settlement") syncSettlement(state);
  view.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function toast(message: string): void {
  const t = el("toast");
  t.textContent = message;
  t.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove("show"), TOAST_MS);
}

function switchRole(role: Role, button: HTMLElement): void {
  setState({ role });
  document.querySelectorAll<HTMLElement>("[data-role]").forEach((b) => b.classList.toggle("on", b === button));
  toast(role === "supplier" ? "공급기업(동양알루텍) 화면으로 전환했습니다" : "구매기업(A정밀) 화면으로 전환했습니다");
  route();
}

document.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;

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

  if (target.id === "btn-deposit") {
    setState({ deposited: true });
    syncSettlement(state);
    toast("테스트 토큰 320,000을 예치했습니다 (가상)");
  } else if (target.id === "btn-pay") {
    setState({ paid: true });
    syncSettlement(state);
    toast("지급과 지급완료 상태를 한 트랜잭션으로 기록했습니다 (가상)");
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

window.addEventListener("hashchange", route);
route();
