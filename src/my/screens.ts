/* 기업 대시보드: 홈 (요약 · 처리할 업무 · 이번 달 조정 금액 · 알림 설정 · 제도 변경) */
import { adjust, pct, signedWon, won } from "../calc";
import { isCounted, NOTICES, TODOS } from "../data";
import { demoContracts, demoRows, taskDone, taskStatus } from "../demo";
import { taskDetailHref } from "../detail-navigation";
import type { Channel, Todo } from "../types";
import { esc, findContract, supplierName } from "../ui";

export interface MyState {
  readonly tab: "home" | "contracts" | "docs" | "settings";
  readonly detail: string | null;
  /** 화면을 열지 않아도 알림을 받을 곳 */
  readonly channels: readonly Channel[];
  /** 알림 받을 일 */
  readonly events: readonly string[];
}

export const CHANNELS: readonly Readonly<{ id: Channel; label: string }>[] = [
  { id: "kakao", label: "카카오톡" },
  { id: "email", label: "이메일" },
  { id: "sms", label: "문자" },
];

const KIND_LABEL: Readonly<Record<Todo["kind"], string>> = { renew: "계약 갱신", unapplied: "발주 미반영", missing: "자료 보완" };

const kpi = (label: string, value: number, unit: string, tone = ""): string =>
  `<div class="kpi ${tone}"><span>${label}</span><b>${value}<small>${unit}</small></b></div>`;

const summary = (open: readonly Todo[]): string => {
  const counted = demoContracts().filter(isCounted);
  const triggered = counted.filter((c) => adjust(c).triggered).length;
  const unapplied = demoRows().filter((row) => {
    const c = findContract(row.contract);
    return c !== undefined && adjust(c).price !== row.poPrice;
  }).length;
  return `<section class="kpis" aria-label="이번 달 요약">
    ${kpi("운영 중인 약정", counted.length, "건")}
    ${kpi("이번 달 조정 대상", triggered, "건")}
    ${kpi("발주 미반영", unapplied, "건", unapplied ? "warn" : "")}
    ${kpi("처리할 업무", open.length, "건", open.length ? "warn" : "")}
  </section>`;
};

const taskTable = (open: readonly Todo[]): string => {
  if (!open.length) return `<section class="panel"><h2>처리할 업무</h2><p class="empty">이번 달 처리할 업무가 없습니다. 다음 지표 확인일은 12월 1일입니다.</p></section>`;
  const byDue = [...open].sort((a, b) => a.due.localeCompare(b.due));
  const rows = byDue.map((t) => {
    const c = findContract(t.contract);
    return `<tr>
      <td><span class="tag ${t.kind}">${KIND_LABEL[t.kind]}</span><b class="item">${esc(c?.item)}</b><small>${esc(t.contract)} · ${esc(supplierName(c?.supplier ?? ""))}</small></td>
      <td>${esc(t.reason)}<small>알림 ${esc(t.notified)} · <b class="status">${esc(taskStatus(t.code))}</b></small></td>
      <td class="n"><b>${esc(t.due)}</b><small>${esc(t.delay)}</small></td>
      <td class="impact-cell">${esc(t.impact)}</td>
      <td class="act"><button class="btn solid sm" data-task="${esc(t.code)}">${esc(t.action)}</button><a class="task-detail" href="${esc(taskDetailHref(t.code))}" aria-label="${esc(c?.item)} 상세 업무 확인">상세 업무 →</a></td></tr>`;
  }).join("");
  return `<section class="panel">
    <div class="panel-h"><h2>처리할 업무</h2><span class="count">${open.length}건 · 기한 빠른 순</span></div>
    <table class="grid task-grid"><thead><tr><th>약정</th><th>내용</th><th class="n">기한</th><th>영향</th><th></th></tr></thead><tbody>${rows}</tbody></table>
  </section>`;
};

const adjustTable = (): string => {
  const counted = demoContracts().filter(isCounted).map((c) => ({ c, r: adjust(c) }));
  const up = counted.filter((x) => x.r.total > 0).reduce((a, x) => a + x.r.total, 0);
  const down = counted.filter((x) => x.r.total < 0).reduce((a, x) => a + x.r.total, 0);
  const rows = counted.map(({ c, r }) => `<tr data-detail="${esc(c.id)}" class="link-row">
      <td><b>${esc(c.item)}</b><small>${esc(c.id)} · ${esc(supplierName(c.supplier))}</small></td>
      <td class="n">${pct(r.rate)}</td>
      <td class="n">${won(c.p0)}</td>
      <td class="n">${r.triggered ? won(r.price) : "변동 없음"}</td>
      <td class="n">${c.qty.toLocaleString()}</td>
      <td class="n ${r.total > 0 ? "up" : r.total < 0 ? "down" : ""}">${r.triggered ? signedWon(r.total) : "-"}</td></tr>`).join("");
  return `<section class="panel">
    <div class="panel-h"><h2>11월 단가 조정</h2><span class="count">약정 ${counted.length}건 기준</span></div>
    <table class="grid"><thead><tr><th>약정</th><th class="n">지표 변동</th><th class="n">기준 단가</th><th class="n">조정 단가</th><th class="n">적용 수량</th><th class="n">차액</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="5">더 지급할 금액 합계</td><td class="n up">${signedWon(up)}</td></tr>
        <tr><td colspan="5">덜 지급할 금액 합계</td><td class="n down">${won(down)}</td></tr></tfoot></table>
    <p class="foot-note">준비 중인 약정과 미연동 합의 건은 합계에서 제외합니다.</p>
  </section>`;
};

const notices = (): string => {
  const items = NOTICES.map((n) => `<li><time>${esc(n.date)}</time><b>${esc(n.title)}</b></li>`).join("");
  return `<section class="panel side"><h2>제도 변경</h2><ul class="notice-list">${items}</ul></section>`;
};

export const homeScreen = (): string => {
  const open = TODOS.filter((t) => !taskDone(t.code));
  return `
    <header class="page-h"><div><h1>업무요약</h1><p>2026년 11월 · 지표 기준일 11월 1일</p></div>
      <button class="btn ghost sm" data-toast="11월 변동표 엑셀을 내려받았습니다 (데모)">11월 변동표 내려받기</button></header>
    ${summary(open)}
    <div class="cols">
      <div class="col-main">${taskTable(open)}${adjustTable()}</div>
      <aside class="col-side"><section class="panel"><h2>상세 업무 바로가기</h2><p class="foot-note">업무요약에서 현황을 확인하고, 필요한 작업만 이어서 진행합니다.</p>
        <nav class="detail-links" aria-label="상세 업무 바로가기">
          <a href="./app.html#/review">신규 약정 검토 →</a>
          <a href="./app.html#/reconcile">발주·청구·지급근거 대조 →</a>
          <a href="./app.html#/requests">자료 요청·공유 이력 →</a>
          <a href="./app.html#/packages">제출 패키지 확인 →</a>
        </nav></section>${notices()}<section class="panel"><h2>지급 시뮬레이션</h2><p class="foot-note">가상 예치·지급 흐름을 확인합니다. 실제 송금은 발생하지 않습니다.</p><a class="task-detail" href="./app.html#/settlement">시뮬레이션 열기 →</a></section></aside>
    </div>`;
};
