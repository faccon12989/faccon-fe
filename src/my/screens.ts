/* 사용자 화면: 홈 · 내 약정 · 약정 상세 · 자료 */
import { adjust, pct, signedWon, won } from "../calc";
import { REQUESTS, TODOS } from "../data";
import { demoContracts, readDemo, taskDone, taskStatus } from "../demo";
import { evidenceView } from "../evidence";
import type { Todo } from "../types";
import { esc, findContract, supplierName } from "../ui";

export interface MyState {
  readonly tab: "home" | "contracts" | "docs";
  readonly detail: string | null;
}

const ICON: Readonly<Record<Todo["kind"], string>> = { unapplied: "₩", renew: "↻", missing: "?" };
const TONE: Readonly<Record<Todo["kind"], string>> = { unapplied: "red", renew: "amber", missing: "blue" };

const todoCard = (t: Todo): string => {
  const c = findContract(t.contract);
  return `<button class="task ${TONE[t.kind]}" data-task="${esc(t.code)}">
    <span class="task-ic" aria-hidden="true">${ICON[t.kind]}</span>
    <span class="task-t"><b>${esc(t.title)} · ${esc(taskStatus(t.code))}</b><small>${esc(c?.item)} · ${esc(t.reason)}</small></span>
    <span class="task-go" aria-hidden="true">›</span>
  </button>`;
};

export const homeScreen = (): string => {
  const open = TODOS.filter((t) => !taskDone(t.code));
  const signed = demoContracts().filter((c) => c.status === "ok").map((c) => adjust(c));
  const up = signed.filter((r) => r.total > 0).reduce((a, r) => a + r.total, 0);
  const down = signed.filter((r) => r.total < 0).reduce((a, r) => a + r.total, 0);
  const tasks = open.length
    ? open.map(todoCard).join("")
    : `<div class="all-done"><span aria-hidden="true">✓</span><b>이번 달 확인할 일을 모두 끝냈어요</b><small>다음 지표 확인일은 12월 1일이에요</small></div>`;
  return `
    <section class="hello">
      <p class="date">2026년 11월</p>
      <h1>${open.length ? `확인할 일이 <em>${open.length}건</em> 있어요` : "모두 정리됐어요"}</h1>
    </section>
    <p class="tiny">${readDemo().setup ? "등록 단계에서 확인한 가상 거래가 연결되어 있어요." : "가상 거래 5건이 준비되어 있어요."} 요청을 보내면 회신·반영 대기 상태로 남아요.</p>
    <section class="tasks" aria-label="확인할 일">${tasks}</section>
    <section class="month">
      <h2>이번 달 단가 변동</h2>
      <div class="month-row">
        <div><small>인상 계산액</small><b class="up">${signedWon(up)}</b></div>
        <div><small>인하 계산액</small><b class="down">${won(down)}</b></div>
      </div>
      <p class="tiny">운영 중 약정 ${signed.length}건의 계산값 · 실제 반영·지급액은 별도로 확인해요</p>
      <button class="link-btn" data-tab="contracts">약정별로 보기 ›</button><p><a href="./app.html#/reconcile">발주·청구·지급근거 대조 →</a></p>
    </section>`;
};

export const contractsScreen = (): string => {
  const cards = demoContracts().map((c) => {
    const r = adjust(c);
    const draft = c.status === "draft";
    const tag = c.status === "renew" ? `<span class="pill2 gray">종료 · 갱신 검토</span>` : draft ? `<span class="pill2 gray">준비 중</span>`
      : !r.triggered ? `<span class="pill2 gray">변동 없음</span>`
      : r.diffPerUnit > 0 ? `<span class="pill2 red">단가 ${pct(r.diffPerUnit / c.p0)} 인상</span>` : `<span class="pill2 blue">단가 ${pct(r.diffPerUnit / c.p0)} 인하</span>`;
    return `<button class="ccard" data-detail="${esc(c.id)}">
      <span class="cc-top"><b>${esc(c.item)}</b>${tag}</span>
      <span class="cc-sup">${esc(supplierName(c.supplier))}</span>
      <span class="cc-price">${draft ? "약정 준비 중" : c.status === "renew" ? `종료 약정 참고: ${won(c.p0)}` : r.triggered ? `${won(c.p0)} → <b>${won(r.price)}</b>` : `<b>${won(c.p0)}</b> 유지`}</span>
    </button>`;
  }).join("");
  return `<section class="hello"><h1>내 약정</h1><p class="date">공급기업 ${demoContracts().length}곳 · 11월 지표 기준</p></section>
    <div class="clist">${cards}</div>`;
};

export const detailScreen = (id: string): string => {
  const c = findContract(id);
  if (!c) return `<p>약정을 찾을 수 없어요.</p>`;
  const r = adjust(c);
  if (c.status === "draft") return `<button class="back" data-tab="contracts">‹ 내 약정</button><section class="hello"><h1>${esc(c.item)}</h1><p>초안 ${esc(c.version)} · 미확정</p></section><section class="month"><h2>투입량 보완과 양사 확인이 필요해요</h2><p>아직 적용할 단가가 확정되지 않았어요. 자료를 보완하고 산출표 초안을 확인해 주세요.</p><a href="./start.html?path=B">신규 약정 검토 →</a></section>`;
  const explain = !r.triggered
    ? `지표가 ${pct(r.rate)} 움직였어요. 약정 요건(±${c.threshold}%)보다 작아서 이번 달은 단가가 그대로예요.`
    : `지표가 ${c.i0}에서 ${r.it}로 ${pct(r.rate)} ${r.diffPerUnit > 0 ? "올라" : "내려"} 약정 요건(±${c.threshold}%)을 넘었어요. 원재료비 ${won(c.m0)}에 ${pct(Math.abs(r.rate))}를 반영해 ${won(Math.abs(r.diffPerUnit))} ${r.diffPerUnit > 0 ? "올라요" : "내려요"}.`;
  return `
    <button class="back" data-tab="contracts">‹ 내 약정</button>
    <section class="hello"><p class="date">${esc(supplierName(c.supplier))} · 약정 ${esc(c.version)}</p><h1>${esc(c.item)}</h1></section>
    <div class="price-hero ${!r.triggered ? "flat" : r.diffPerUnit > 0 ? "up" : "down"}">
      <small>${c.status === "renew" ? "종료 약정의 참고 단가 · 갱신 검토 필요" : "약정 산출 단가 · 발주 반영 확인 별도"}</small><b>${won(r.price)}</b>
      <span>${r.triggered ? `기존 ${won(c.p0)} · ${c.qty.toLocaleString()}개면 ${signedWon(r.total)}` : "변동 없음"}</span>
    </div>
    <section class="explain"><h2>왜 이렇게 됐나요?</h2><p>${explain}</p>
      <p class="formula-s">${!r.triggered ? "요건 미충족 → 기준단가 유지. 참고 산식: " : ""}${c.p0.toLocaleString()} + ${c.m0.toLocaleString()} × (${r.it} − ${c.i0}) ÷ ${c.i0} = ${!r.triggered ? "요건 충족 시에만 적용" : r.price.toLocaleString()}</p></section>
    <section class="facts"><h2>약정 내용</h2>
      <dl><dt>원재료</dt><dd>${esc(c.material)}</dd><dt>지표</dt><dd>${esc(c.index)}</dd>
      <dt>확인 주기</dt><dd>${esc(c.cycle)}</dd><dt>적용</dt><dd>${esc(c.applyDay)}</dd><dt>계약 종료</dt><dd>${esc(c.end)}</dd></dl>
      <p class="tiny">🔒 공급기업의 원가 원문은 보이지 않아요. 양사가 합의한 값만 보여요.</p></section>`;
};

export const docsScreen = (): string => {
  const items = REQUESTS.map((q) => `<li class="doc">
      <span class="doc-ic" aria-hidden="true">${q.reuse ? "↺" : "↗"}</span>
      <span><b>${esc(q.item)}</b><small>${esc(supplierName(q.supplier))} · ${esc(q.reuse ? `기존 자료 재사용 (${q.reuse})` : taskStatus("C-103"))}</small></span>
    </li>`).join("");
  return `<section class="hello"><h1>자료</h1><p class="date">공급기업과 주고받은 요청</p></section>
    <ul class="docs">${items}</ul>${evidenceView("buyer")}
    <section class="month"><h2>제출할 자료 만들기</h2>
      <p class="tiny">출력한 요약과 출처 색인을 바탕으로, 기관이 요청한 서식·원문을 준비하세요.</p>
      <p><a href="./app.html#/packages">전체 증빙·원문 색인 확인 →</a></p>
    </section>`;
};
