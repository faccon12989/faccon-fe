import { adjust, signedWon, won } from "../calc";
import { SELF_SUPPLIER, TODOS } from "../data";
import { demoRows, taskDone, taskStatus } from "../demo";
import type { Role, TodoKind } from "../types";
import { adjustPill, esc, findContract, supplierName, visibleContracts } from "../ui";

const TODO_ICON: Readonly<Record<TodoKind, readonly [string, string]>> = {
  renew: ["p-warn", "갱"],
  unapplied: ["p-bad", "반"],
  missing: ["p-info", "보"],
};

export const dashboardView = (role: Role): string => {
  const list = visibleContracts(role);
  const results = list.map((c) => ({ c, r: adjust(c) }));
  // 약정 전(초안) 계약은 예상액 합계에서 뺀다.
  const signed = results.filter((x) => x.c.status === "ok");
  const up = signed.filter((x) => x.r.total > 0).reduce((sum, x) => sum + x.r.total, 0);
  const down = signed.filter((x) => x.r.total < 0).reduce((sum, x) => sum + x.r.total, 0);
  const unapplied = demoRows().filter((row) => {
    const c = findContract(row.contract);
    return c !== undefined && list.some((item) => item.id === c.id) && adjust(c).price !== row.poPrice;
  }).length;
  const todos = TODOS.filter((t) => list.some((c) => c.id === t.contract) && !taskDone(t.code));

  const todoHtml = todos.length
    ? todos.map((t) => {
        const [cls, letter] = TODO_ICON[t.kind];
        return `<div class="todo">
          <div class="ic pill ${cls}" style="border-radius:9px;padding:0" aria-hidden="true">${letter}</div>
          <div class="t"><b>${esc(t.code)} · ${esc(t.title)} <span class="tag">${esc(taskStatus(t.code))}</span></b><small>${esc(t.contract)} ${esc(findContract(t.contract)?.item)} — ${esc(t.reason)}</small></div>
          <a class="btn" href="${esc(t.go)}">${esc(t.next)} →</a>
        </div>`;
      }).join("")
    : `<div class="empty">처리할 항목이 없습니다</div>`;

  const rows = results.map(({ c, r }) => `
    <tr class="click" data-go="#/contracts/${esc(c.id)}"><td><b>${esc(c.id)}</b><br><small style="color:var(--mute)">${esc(c.item)}</small></td>
    <td>${adjustPill(r)}</td>
    <td class="num ${r.total > 0 && c.status !== "draft" ? "diff-up" : ""}">${!r.triggered ? "-" : c.status === "draft" ? `<small style="color:var(--mute)">약정 전 · 참고</small> ${signedWon(r.total)}` : signedWon(r.total)}</td></tr>`).join("");

  const heading = role === "supplier" ? "우리 회사 거래 현황" : "이번 달 운영 현황";
  const sub = role === "supplier"
    ? `${esc(supplierName(SELF_SUPPLIER))} · A정밀 (가상)과의 연동 거래만 보입니다`
    : "11월 지표 반영 기준 · 등록된 계약만 집계합니다";

  return `
    <h1>${heading}</h1>
    <p class="sub">${sub}</p>
    <div class="grid g4">
      <div class="card kpi"><small>운영 중인 약정</small><b>${list.filter((c) => c.status === "ok").length}건</b><span>신규 준비 ${list.filter((c) => c.status === "draft").length}건</span></div>
      <div class="card kpi up"><small>이번 달 인상 예상액</small><b>${won(up)}</b><span>운영 중 약정의 계산값 · 지급액 아님</span></div>
      <div class="card kpi down"><small>이번 달 인하 예상액</small><b>${won(Math.abs(down))}</b><span>하락분도 약정대로 반영</span></div>
      <div class="card kpi"><small>발주 미반영</small><b>${unapplied}건</b><span>계산단가 ≠ 발주단가</span></div>
    </div>
    <div class="grid g2" style="margin-top:16px">
      <section class="card">
        <div class="between"><h2>지금 처리할 항목</h2><span class="tag">알림은 위반 확정이 아니라 재검토 요청</span></div>
        ${todoHtml}
      </section>
      <section class="card">
        <h2>계약별 이번 달 조정</h2>
        <div class="tbl"><table>
          <thead><tr><th>계약</th><th>변동</th><th class="num">조정 차액</th></tr></thead>
          <tbody>${rows}</tbody></table></div>
        <p class="note">조정 차액은 양사 간 이전금액입니다. 구매기업의 이득이나 절감액으로 계산하지 않습니다.</p>
      </section>
    </div>`;
};
