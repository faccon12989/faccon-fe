/* 서비스 소개 페이지: 계산 예시, 이용자 탭 */
import "./site.css";
import { adjust, pct, signedWon, won } from "../calc";
import { CONTRACTS, isCounted, RECONCILE } from "../data";
import type { Contract } from "../types";
import { esc } from "../ui";

/** 소개용 가상 거래 (기획서 부록 A 예시와 같은 조건) */
const SAMPLE: Readonly<Contract> = {
  id: "SAMPLE", supplier: "-", item: "알루미늄 브래킷", material: "알루미늄", path: "A",
  p0: 10000, m0: 4000, i0: 100, it: 108, threshold: 5, qty: 1000,
  cycle: "월 1회", applyDay: "익월 1일", index: "가상 지수", end: "-", version: "v1", status: "ok", stepNow: 6,
};

const TABS = ["buyer", "supplier", "agency"] as const;
type Tab = (typeof TABS)[number];

const byId = <T extends HTMLElement>(id: string): T | null => {
  return document.getElementById(id) as T | null;
};

const renderCalc = (it: number): void => {
  const out = byId<HTMLElement>("site-calc");
  const label = byId<HTMLOutputElement>("site-it-out");
  if (!out || !label) return;
  const r = adjust(SAMPLE, it);
  label.textContent = String(it);
  const tone = !r.triggered ? "flat" : r.diffPerUnit > 0 ? "up" : "down";
  const verdict = !r.triggered
    ? `변동 ${pct(r.rate)} · 요건(±${SAMPLE.threshold}%) 미만이라 조정 없음`
    : `변동 ${pct(r.rate)} · 요건 충족, ${r.diffPerUnit > 0 ? "인상" : "인하"}`;
  out.className = `calc-out ${tone}`;
  out.innerHTML = `
    <div class="co-row"><span>기준 단가</span><b>${won(SAMPLE.p0)}</b></div>
    <div class="co-row big"><span>이번 달 단가</span><b>${won(r.price)}</b></div>
    <div class="co-row"><span>1,000개 차액</span><b>${r.triggered ? signedWon(r.total) : "0원"}</b></div>
    <p class="co-note">${verdict}</p>
    <p class="co-formula">10,000 + 4,000 × (${it} − 100) ÷ 100</p>`;
};

const selectTab = (tab: Tab, focus = false): void => {
  TABS.forEach((t) => {
    const btn = byId<HTMLButtonElement>(`t-${t}`);
    const panel = byId<HTMLElement>(`tab-${t}`);
    if (!btn || !panel) return;
    const on = t === tab;
    btn.setAttribute("aria-selected", String(on));
    btn.tabIndex = on ? 0 : -1;
    panel.hidden = !on;
    if (on && focus) btn.focus();
  });
};

const isTab = (value: string | undefined): value is Tab => {
  return TABS.includes(value as Tab);
};

const setupTabs = (): void => {
  const list = document.querySelector<HTMLElement>('[role="tablist"]');
  if (!list) return;
  list.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>("[data-tab]");
    if (btn && isTab(btn.dataset.tab)) selectTab(btn.dataset.tab);
  });
  list.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const current = TABS.findIndex((t) => byId(`t-${t}`)?.getAttribute("aria-selected") === "true");
    const step = e.key === "ArrowRight" ? 1 : -1;
    const next = TABS[(current + step + TABS.length) % TABS.length];
    if (next) selectTab(next, true);
  });
};

const setupSlider = (): void => {
  const input = byId<HTMLInputElement>("site-it");
  if (!input) return;
  input.addEventListener("input", () => renderCalc(Number(input.value)));
  renderCalc(Number(input.value));
};

/** 첫 화면 변동표: 앱과 같은 가상 데이터로 그린다 */
const renderLedger = (): void => {
  const body = byId<HTMLElement>("ledger-rows");
  const foot = byId<HTMLElement>("ledger-foot");
  if (!body || !foot) return;
  const rows = CONTRACTS.filter(isCounted).map((c) => {
    const r = adjust(c);
    const po = RECONCILE.find((x) => x.contract === c.id)?.poPrice ?? null;
    const missed = po !== null && po !== r.price;
    const state = c.status === "renew" ? ["warn", "갱신 확인"] : missed ? ["bad", "발주 미반영"] : ["ok", "일치"];
    return { c, r, po, missed, state };
  });
  body.innerHTML = rows.map(({ c, r, po, missed, state }) => `<tr class="${missed ? "hit" : ""}">
      <td><b>${esc(c.id)}</b><small>${esc(c.item)}</small></td>
      <td class="n">${r.it} <small>${r.rate > 0 ? "+" : ""}${pct(r.rate)}</small></td>
      <td class="n">${won(r.price)}</td>
      <td class="n ${missed ? "strike" : ""}">${po === null ? "-" : won(po)}</td>
      <td><span class="st ${state[0]}">${state[1]}</span></td></tr>`).join("");
  const missedTotal = rows.filter((x) => x.missed).reduce((a, x) => a + x.r.total, 0);
  foot.innerHTML = `미반영 ${rows.filter((x) => x.missed).length}건 · 차액 후보 <b>${signedWon(missedTotal)}</b> · 갱신 확인 ${rows.filter((x) => x.c.status === "renew").length}건`;
};

renderLedger();
setupSlider();
setupTabs();
