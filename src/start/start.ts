/* 시작하기 화면: 상태 관리와 이벤트 연결 */
import "../site/site.css";
import "./start.css";
import {
  ALERT_CHANNELS, AUTO_MAPPING, ERP_FIELDS, INITIAL, LAST_STEP, MOCK_EXTRACTION, STEP_TITLES,
  type Invite, type ShareScope, type StartState, update, validate,
} from "./model";
import { saveDemo } from "../demo";
import { renderDone, renderStep } from "./steps";

const UPLOAD_DELAY_MS = 700;
const requestedPath = new URLSearchParams(location.search).get("path");

let state: StartState = { ...INITIAL, path: requestedPath === "A" || requestedPath === "B" ? requestedPath : null,
  company: "A정밀 (가상)", manager: "김구매 (가상)", email: "buyer@example.invalid", category: "알루미늄 가공품" };

const $ = (id: string): HTMLElement => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} 요소가 없습니다`);
  return node;
};

const renderRail = (): void => {
  $("rail").innerHTML = STEP_TITLES.map((t, i) => {
    const cls = state.done || i < state.step ? "done" : i === state.step ? "now" : "";
    const label = i === 2 && state.path === "B" ? "준비 자료" : t;
    return `<li class="${cls}" ${i === state.step && !state.done ? 'aria-current="step"' : ""}><span>${i + 1}</span>${label}</li>`;
  }).join("");
};

const render = (focusTitle = false): void => {
  renderRail();
  const pane = $("step");
  const actions = document.querySelector<HTMLElement>(".actions");
  if (state.done) {
    pane.innerHTML = renderDone(state);
    if (actions) actions.hidden = true;
  } else {
    pane.innerHTML = renderStep(state);
    if (actions) actions.hidden = false;
    ($("back") as HTMLButtonElement).disabled = state.step === 0;
    $("next").textContent = state.step === LAST_STEP ? "데모 설정 저장" : "다음";
  }
  $("err").textContent = "";
  if (focusTitle) pane.querySelector<HTMLElement>("h1")?.setAttribute("tabindex", "-1");
  if (focusTitle) pane.querySelector<HTMLElement>("h1")?.focus();
};

/** 폼의 현재 입력값을 상태로 읽어 온다 (새 상태 반환). */
const readForm = (s: StartState): StartState => {
  const form = $("step-form") as HTMLFormElement;
  const data = new FormData(form);
  const text = (k: string, fallback: string): string => (data.has(k) ? String(data.get(k) ?? "") : fallback);
  switch (s.step) {
    case 0: {
      const p = data.get("path");
      return update(s, { path: p === "A" || p === "B" ? p : s.path });
    }
    case 1:
      return update(s, {
        company: text("company", s.company), manager: text("manager", s.manager), email: text("email", s.email),
        approver: text("approver", s.approver), category: text("category", s.category),
        phone: text("phone", s.phone),
        channels: ALERT_CHANNELS.filter((ch) => data.getAll("channel").includes(ch.id)).map((ch) => ch.id),
      });
    case 2: {
      if (s.path === "B") return update(s, { checklist: data.getAll("checklist").map(String) });
      const confirmed = new Set(data.getAll("confirm").map(String));
      return update(s, { extracted: s.extracted.map((x) => ({ ...x, confirmed: confirmed.has(x.key) })) });
    }
    case 3: {
      const invites = s.invites.map((_, i) => ({ company: text(`inv-company-${i}`, ""), email: text(`inv-email-${i}`, "") }));
      const scope = data.get("scope");
      return update(s, { invites, shareScope: (scope === "result+summary" ? scope : "result") as ShareScope });
    }
    case 4: {
      const mapping = Object.fromEntries(ERP_FIELDS.map((f) => [f, text(`map-${f}`, s.mapping[f] ?? "")]));
      return update(s, { mapping });
    }
    case 5:
      return update(s, { measureConsent: data.get("consent") === "on" });
    default:
      return s;
  }
};

const go = (next: number): void => {
  state = update(state, { step: Math.max(0, Math.min(LAST_STEP, next)) });
  render(true);
  window.scrollTo({ top: 0 });
};

const fakeUpload = (button: HTMLButtonElement, apply: () => StartState): void => {
  button.disabled = true;
  button.innerHTML = "<b>파일을 읽는 중…</b><span>조건과 원문 위치를 찾고 있습니다</span>";
  window.setTimeout(() => { state = apply(); render(); }, UPLOAD_DELAY_MS);
};

document.addEventListener("click", (e) => {
  const t = e.target instanceof Element ? e.target.closest<HTMLButtonElement>("button") : null;
  if (!t) return;
  switch (t.id) {
    case "back": state = readForm(state); go(state.step - 1); break;
    case "mock-upload": fakeUpload(t, () => update(state, { uploaded: true, extracted: MOCK_EXTRACTION })); break;
    case "confirm-all": state = update(state, { extracted: state.extracted.map((x) => ({ ...x, confirmed: x.confidence >= 0.8 })) }); render(); break;
    case "resolve-apply": state = update(state, { extracted: state.extracted.map((x) => x.key === "apply" ? { ...x, value: "익월 1일 이후 검수분", source: "양사 보완합의서 p.1 (가상)", confidence: 1, confirmed: true } : x) }); render(); break;
    case "skip-invite": state = update(state, { invites: [] }); go(state.step + 1); break;
    case "add-invite": state = readForm(state); state = update(state, { invites: [...state.invites, { company: "", email: "" }] }); render(); break;
    case "mock-erp": fakeUpload(t, () => update(state, { erpUploaded: true, mapping: AUTO_MAPPING })); break;
    case "skip-erp": state = update(state, { erpUploaded: false, mapping: {} }); go(state.step + 1); break;
    default: break;
  }
});

/* 시작 방식 카드는 고르는 즉시 강조 표시를 바꾼다. */
document.addEventListener("change", (e) => {
  const input = e.target;
  if (input instanceof HTMLInputElement && input.name === "path") {
    state = readForm(state);
    document.querySelectorAll(".choice").forEach((c) => c.classList.toggle("on", c.contains(input)));
  }
});

$("step-form").addEventListener("submit", (e) => {
  e.preventDefault();
  state = readForm(state);

  // ERP를 건너뛴 경우에는 4단계 검증을 통과시킨다.
  const skippedErp = state.step === 4 && !state.erpUploaded && document.getElementById("skip-erp") === null;
  const problem = skippedErp ? null : validate(state);
  if (problem) { $("err").textContent = problem; return; }
  if (state.step === LAST_STEP) { localStorage.setItem("faccon-setup-meta", JSON.stringify({ invite: state.invites.some((i: Invite): boolean => i.company.trim().length > 0), erp: state.erpUploaded })); saveDemo({ setup: state.path }); state = update(state, { done: true }); render(true); return; }
  go(state.step + 1);
});

render();
