/* 사용자 앱: 탭 이동, 할 일 해결 시트 */
import "../site/site.css";
import "./my.css";
import "../workflow.css";
import { setContext } from "../context";
import { downloadMonthly } from "../monthly";
import { readWork, saveWork, transition } from "../workflow";
import { downloadEvidence } from "../evidence";
import { requestTask, resetDemo } from "../demo";
import { taskDetailHref } from "../detail-navigation";
import { esc } from "../ui";
import { type FlowStep, flowFor, type TaskId } from "./flows";
import { contractsScreen, detailScreen } from "./contract-views";
import { docsScreen } from "./docs-view";
import { ALERT_EVENTS, settingsScreen } from "./settings-view";
import { CHANNELS, homeScreen, type MyState } from "./screens";
import type { Channel } from "../types";

const TABS = [
  { id: "home", label: "업무요약" },
  { id: "contracts", label: "약정" },
  { id: "docs", label: "자료·제출" },
  { id: "settings", label: "설정" },
] as const;
const TOAST_MS = 2000;

setContext("buyer");
const loadPreferences = (): Pick<MyState, "channels" | "events"> => {
  const defaults: Pick<MyState, "channels" | "events"> = { channels: ["kakao", "email"], events: ALERT_EVENTS.map((e: (typeof ALERT_EVENTS)[number]): string => e.id) };
  try {
    const x: unknown = JSON.parse(localStorage.getItem("faccon-alerts-v1") ?? "null");
    if (typeof x !== "object" || x === null || !("channels" in x) || !("events" in x) || !Array.isArray(x.channels) || !Array.isArray(x.events)) return defaults;
    return { channels: CHANNELS.filter((c: (typeof CHANNELS)[number]): boolean => (x.channels as unknown[]).includes(c.id)).map((c: (typeof CHANNELS)[number]): Channel => c.id), events: ALERT_EVENTS.filter((e: (typeof ALERT_EVENTS)[number]): boolean => (x.events as unknown[]).includes(e.id)).map((e: (typeof ALERT_EVENTS)[number]): string => e.id) };
  } catch { return defaults; }
};
let state: MyState = { tab: "home", detail: null, ...loadPreferences() };
let flow: { id: TaskId; steps: FlowStep[]; at: number } | null = null;
let lastFocus: HTMLElement | null = null;
let requestChoice = "extend";
let requestDetail = "";
let toastTimer: number | undefined;

const byId = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} 요소가 없습니다`);
  return el;
};

const setState = (patch: Partial<MyState>): void => {
  state = { ...state, ...patch };
  localStorage.setItem("faccon-alerts-v1", JSON.stringify({ channels: state.channels, events: state.events }));
  render();
};

const render = (): void => {
  const screen = byId("screen");
  screen.innerHTML = state.detail ? detailScreen(state.detail)
    : state.tab === "contracts" ? contractsScreen()
    : state.tab === "docs" ? docsScreen()
    : state.tab === "settings" ? settingsScreen(state)
    : homeScreen();
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
  requestChoice = "extend"; requestDetail = "";
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
  if (lastFocus?.isConnected) lastFocus.focus(); else byId("screen").focus();
};

const advance = (): void => {
  if (!flow) return;
  if (flow.at === 1) {
    requestChoice = document.querySelector<HTMLInputElement>('input[name="renew"]:checked')?.value ?? "request";
    requestDetail = document.querySelector<HTMLSelectElement>('select[name="to"],select[name="due"]')?.value ?? "계약 담당자 확인";
    requestTask(flow.id, requestChoice, requestDetail);
    if (flow.id === "C-103" && readWork().phase === "draft") saveWork(transition(readWork(), { action: "request", role: "buyer", supplier: "S-04", revision: readWork().revision }));
    const message = flow.id === "C-101" ? (requestChoice === "end" ? "거래 종료 의사를 기록했습니다. 남은 발주 2건의 취소·이행 여부를 확인할 때까지 대기합니다." : requestChoice === "check" ? "계약 담당자에게 확인할 항목을 기록했습니다. 회신이 올 때까지 대기합니다." : "갱신 확인 요청을 기록했습니다. 갱신본과 서명이 확인되기 전에는 완료로 바뀌지 않습니다.")
      : flow.id === "C-102" ? `수정 요청 대상: ${requestDetail}. 발주 파일에서 변경 단가가 확인될 때 완료 처리합니다.` : `보완 요청 기한: ${requestDetail}. 자료 회신·검토 후에 처리합니다.`;
    flow = { ...flow, steps: flow.steps.map((step: FlowStep, i: number): FlowStep => i === 2 ? { title: "요청을 기록했습니다 · 처리 대기", body: `<p>${esc(message)}</p><p class="note-s">가상 시나리오만 저장됩니다. 실제 메일은 보내지 않습니다.</p><a href="${esc(taskDetailHref(flow?.id ?? ""))}">후속 업무 확인 →</a>`, cta: "대기 상태로 돌아가기" } : step) };
  }
  if (flow.at < flow.steps.length - 1) {
    flow = { ...flow, at: flow.at + 1 };
    renderSheet();
    return;
  }
  closeFlow();
  render();
  toast("요청을 기록했습니다. 처리될 때까지 대기로 표시합니다");
};

const toggleEvent = (id: string, label: string): void => {
  const on = state.events.includes(id);
  setState({ events: on ? state.events.filter((e) => e !== id) : [...state.events, id] });
  toast(on ? `${label} 알림을 껐습니다` : `${label} 알림을 켰습니다`);
};

const toggleChannel = (id: Channel, label: string): void => {
  const on = state.channels.includes(id);
  setState({ channels: on ? state.channels.filter((c) => c !== id) : [...state.channels, id] });
  toast(on ? `${label} 알림을 껐습니다` : `${label} 수신 설정을 저장했습니다 (실제 발송 없음)`);
};

document.addEventListener("click", (e) => {
  const el = e.target instanceof Element ? e.target : null;
  if (!el) return;
  if (el.closest("[data-reset]")) { if (window.confirm("가상 시나리오를 처음 상태로 되돌리시겠습니까?")) { resetDemo(); render(); } return; }
  const monthly = el.closest<HTMLElement>("[data-monthly]");
  if (monthly) { downloadMonthly(monthly.dataset.monthly || undefined); return; }
  if (el.closest("[data-export-csv]")) { downloadEvidence("buyer"); return; }
  if (el.closest("[data-print]")) { window.print(); return; }
  const tab = el.closest<HTMLElement>("[data-tab]");
  if (tab?.dataset.tab === "home" || tab?.dataset.tab === "contracts" || tab?.dataset.tab === "docs" || tab?.dataset.tab === "settings") {
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
  const ev = ALERT_EVENTS.find((x) => x.id === el.closest<HTMLElement>("[data-event]")?.dataset.event);
  if (ev) { toggleEvent(ev.id, ev.label); return; }
  const t = el.closest<HTMLElement>("[data-toast]");
  if (t?.dataset.toast) toast(t.dataset.toast);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && flow) closeFlow();
  if (e.key === "Tab" && flow) {
    const focusable = Array.from(byId("sheet").querySelectorAll<HTMLElement>('button:not(:disabled), input, select, a[href]'));
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === byId("sheet-title"))) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
});

render();

window.addEventListener("storage", (): void => { if (!flow) render(); });
// 다른 페이지에서 뒤로 돌아왔을 때도 최신 반영 상태를 표시합니다.
window.addEventListener("pageshow", (): void => { if (!flow) render(); });
