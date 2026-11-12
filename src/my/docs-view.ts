/* 기업 대시보드: 자료 요청 · 제출 자료 */
import { PURPOSES, REQUESTS } from "../data";
import { demoContracts, demoRows, taskStatus } from "../demo";
import { evidenceView } from "../evidence";
import { esc, supplierName } from "../ui";

export const docsScreen = (): string => {
  const reqRows = REQUESTS.map((q) => `<tr>
      <td class="mono-cell">${esc(q.id)}</td>
      <td><b>${esc(q.item)}</b><small>${esc(q.why)}</small></td>
      <td>${esc(supplierName(q.supplier))}</td>
      <td>${esc(q.period)}</td>
      <td>${esc(q.reuse ? `재사용 (${q.reuse})` : taskStatus("C-103"))}</td></tr>`).join("");
  const purposeRows = PURPOSES.map((p) => {
    const items = p.items.map((i) => ({ ...i, ready: i.ready || (i.doc.includes("갱신") ? demoContracts().find((c): boolean => c.id === "ST-005")?.status === "ok" : i.doc.includes("반영") ? demoRows().every((row): boolean => row.invPrice !== null && row.poPrice === row.invPrice) : false) }));
    const ready = items.filter((i) => i.ready).length;
    const missing = items.filter((i) => !i.ready).map((i) => esc(i.doc)).join(", ") || "-";
    return `<tr><td><b>${esc(p.name)}</b></td><td class="n">${ready} / ${p.items.length}</td><td>${missing}</td>
      <td class="act"><a class="btn ghost sm" href="./app.html?purpose=${esc(p.id)}#/packages">요약·누락자료 확인</a></td></tr>`;
  }).join("");
  return `
    <header class="page-h"><div><h1>자료·제출</h1><p>공급사 자료 요청과 제출용 자료 묶음</p></div></header>
    <section class="panel"><div class="panel-h"><h2>공급사 자료 요청</h2><a href="./app.html#/requests">공유·열람 이력 확인 →</a></div>
      <table class="grid"><thead><tr><th>번호</th><th>요청 항목</th><th>공급사</th><th>기간</th><th>상태</th></tr></thead><tbody>${reqRows}</tbody></table></section>
    <section class="panel"><div class="panel-h"><h2>제출 자료 묶음</h2><a href="./app.html#/packages">패키지 상세 확인 →</a></div><p class="foot-note">항목 예시이며 실제 공고 기준으로 조정합니다.</p>
      <table class="grid"><thead><tr><th>제출 목적</th><th class="n">준비</th><th>부족한 자료</th><th></th></tr></thead><tbody>${purposeRows}</tbody></table></section>
    ${evidenceView("buyer")}`;
};
