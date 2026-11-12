/* 사용자 앱: 탭 이동, 할 일 해결 시트 */
import "../site/site.css";
import "./my.css";
import { type FlowStep, flowFor, type TaskId } from "./flows";
import { CHANNELS, contractsScreen, detailScreen, docsScreen, homeScreen, type MyState } from "./screens";
import type { Channel } from "../types";

const TABS = [
  { id: "home", label: "홈" },
  { id: "contracts", label: "내 약정" },
  { id: "docs", label: "자료" },
] as const;
const TOAST_MS = 2000;

let state: MyState = { tab: "home", detail: null, doneTasks: [], channels: ["kakao", "email"] };
let flow: { id: TaskId; steps: FlowStep[]; at: number } | null = null;
let lastFocus: HTMLElement | null = null;
let toastTimer: number | undefined;

const byId = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} 요소가 없습니다`);
  return el;
};

const setState = (patch: Partial<MyState>): void => {
  state = { ...state, ...patch };
  render();
};

const render = (): void => {
  const screen = byId("screen");
  screen.innerHTML = state.detail ? detailScreen(state.detail)
    : state.tab === "contracts" ? contractsScreen()
    : state.tab === "docs" ? docsScreen()
    : homeScreen(state);
  byId("tabbar").innerHTML = TABS.map((t) => {
    const on = t.id === state.tab;
    return `<button data-tab="${t.id}" class="${on ? "on" : ""}" ${on ? 'aria-current="page"' : ""}>${t.label}</button>`;
  }).join("");
};

const toast = (msg: string): void => {
  const t = byId("toast");
  t.textContent = msg;
  t.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove("show"), TOAST_MS);
};

const renderSheet = (): void => {
  if (!flow) return;
  const step = flow.steps[flow.at];
  if (!step) return;
  const dots = flow.steps.map((_, i) => `<span class="${i <= flow!.at ? "on" : ""}"></span>`).join("");
  byId("sheet").innerHTML = `
    <div class="sheet-head"><div class="dots" aria-label="${flow.at + 1} / ${flow.steps.length} 단계">${dots}</div>
      <button class="x" data-close aria-label="닫기">×</button></div>
    <h2 id="sheet-title" tabindex="-1">${step.title}</h2>
    <div class="sheet-body">${step.body}</div>
    <button class="btn solid lg wide" data-advance>${step.cta}</button>`;
  byId("sheet-title").focus();
};

const openFlow = (id: TaskId, opener: HTMLElement): void => {
  lastFocus = opener;
  flow = { id, steps: flowFor(id), at: 0 };
  byId("sheet-bg").hidden = false;
  byId("sheet").hidden = false;
  document.body.classList.add("locked");
  renderSheet();
};

const closeFlow = (): void => {
  flow = null;
  byId("sheet-bg").hidden = true;
  byId("sheet").hidden = true;
  document.body.classList.remove("locked");
  lastFocus?.focus();
};

const advance = (): void => {
  if (!flow) return;
  if (flow.at < flow.steps.length - 1) {
    flow = { ...flow, at: flow.at + 1 };
    renderSheet();
    return;
  }
  const done = flow.id;
  closeFlow();
  setState({ doneTasks: [...state.doneTasks, done] });
  toast("할 일을 처리했어요");
};

const toggleChannel = (id: Channel, label: string): void => {
  const on = state.channels.includes(id);
  setState({ channels: on ? state.channels.filter((c) => c !== id) : [...state.channels, id] });
  toast(on ? `${label} 알림을 껐어요` : `${label}로도 알려드릴게요`);
};

document.addEventListener("click", (e) => {
  const el = e.target instanceof Element ? e.target : null;
  if (!el) return;
  const tab = el.closest<HTMLElement>("[data-tab]");
  if (tab?.dataset.tab === "home" || tab?.dataset.tab === "contracts" || tab?.dataset.tab === "docs") {
    setState({ tab: tab.dataset.tab, detail: null });
    window.scrollTo({ top: 0 });
    return;
  }
  const detail = el.closest<HTMLElement>("[data-detail]");
  if (detail?.dataset.detail) { setState({ tab: "contracts", detail: detail.dataset.detail }); window.scrollTo({ top: 0 }); return; }
  const task = el.closest<HTMLElement>("[data-task]");
  const tid = task?.dataset.task;
  if (task && (tid === "C-101" || tid === "C-102" || tid === "C-103")) { openFlow(tid, task); return; }
  if (el.closest("[data-advance]")) { advance(); return; }
  if (el.closest("[data-close]") || el.id === "sheet-bg") { closeFlow(); return; }
  const chan = el.closest<HTMLElement>("[data-channel]");
  const picked = CHANNELS.find((ch) => ch.id === chan?.dataset.channel);
  if (picked) { toggleChannel(picked.id, picked.label); return; }
  const t = el.closest<HTMLElement>("[data-toast]");
  if (t?.dataset.toast) toast(t.dataset.toast);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && flow) closeFlow();
});

render();
