import { adjust, signedWon, won } from "../calc";
import { ACCESS_LOG, REQUESTS, SELF_SUPPLIER } from "../data";
import { demoRows, readDemo, reconcileChecks, taskStatus } from "../demo";
import { evidenceView } from "../evidence";
import type { Role } from "../types";
import { esc, findContract, pill, supplierName, visibleContracts } from "../ui";

const STAGES = ["산출", "발주 반영", "청구 일치", "지급근거"] as const;
export const reconcileView = (role: Role): string => {
  const list = visibleContracts(role);
  const rows = demoRows().flatMap((row): readonly string[] => {
    const c = findContract(row.contract);
    if (!c || !list.some((item): boolean => item.id === c.id)) return [];
    const r = adjust(c);
    const checks = reconcileChecks(row, c);
    const active = c.status === "ok";
    const gap = (r.price - row.poPrice) * row.qty;
    const label = !active ? "갱신 검토 우선" : !checks[1] ? "발주 불일치" : row.invPrice === null ? "청구자료 대기" : !checks[2] ? "청구 불일치" : !row.paid ? "지급근거 대기" : "대조 완료";
    return [`<tr><td><b>${esc(c.id)}</b><br>${esc(supplierName(c.supplier))}</td><td>${esc(row.po)}</td>
      <td class="num">${active ? won(r.price) : "참고값 제외"}</td><td class="num">${won(row.poPrice)}</td><td class="num">${won(row.invPrice)}</td>
      <td class="num">${!active ? "검토 후 산출" : gap ? signedWon(gap) : "일치"}</td>
      <td><div class="track">${checks.map((ok: boolean): string => `<span class="${ok ? "on" : ""}"></span>`).join("")}</div><div class="track-lbl">${STAGES.map((s: string): string => `<span>${esc(s)}</span>`).join("")}</div></td><td>${pill(checks.every(Boolean) ? "p-ok" : "p-warn", label)}</td></tr>`];
  }).join("");
  const s = readDemo();
  const action = !s.po ? "① 수정된 발주 파일 반영" : !s.invoice ? "② 청구 파일 반영" : !s.payment ? "③ 지급근거 확인" : "AL-001 대조 완료";
  return `<h1>발주·청구 반영 대조</h1><p class="sub">계산값, 발주, 청구, 지급근거를 각각 확인합니다. 요청만으로 완료 처리하지 않습니다.</p>
    <section class="card"><h2>AL-001 · ${esc(taskStatus("C-102"))}</h2><p>계산단가 ${won(10320)} · 수량 1,000개. 아래 버튼은 실제 ERP 연결 없이 가상 파일 수신을 재현합니다.</p>
      ${role === "buyer" ? `<div class="row"><button class="btn" data-request-po ${s.po ? "disabled" : ""}>수정 요청 기록 (데모)</button><button class="btn pri" data-next-evidence ${s.payment ? "disabled" : ""}>${action} (가상)</button></div>` : `<p>구매기업이 등록한 발주·청구·지급근거를 자사 거래 범위에서 조회합니다.</p>`}</section>
    <section class="card" style="margin-top:16px"><div class="tbl"><table><thead><tr><th>계약</th><th>발주번호</th><th>계산단가</th><th>발주단가</th><th>청구단가</th><th>발주 차이 × 수량</th><th>근거별 확인</th><th>상태</th></tr></thead><tbody>${rows}</tbody></table></div><p class="note">청구 단가가 일치하더라도 다른 단계의 불일치는 그대로 표시합니다. 실제 ERP에 값을 쓰거나 송금하지 않습니다.</p></section>`;
};
export const requestsView = (role: Role): string => {
  const supplier = role === "supplier";
  const list = visibleContracts(role);
  const rows = REQUESTS.filter((q): boolean => !supplier || q.supplier === SELF_SUPPLIER);
  const body = rows.map((q): string => `<tr><td><b>${esc(q.id)}</b><br>${esc(q.contract)} · ${esc(supplierName(q.supplier))}</td><td>${esc(q.item)}<br><small>${esc(q.why)}</small></td><td>${esc(q.period)}</td><td>${esc(q.to)}</td><td>${pill(q.reuse ? "p-ok" : "p-warn", q.reuse ? "기존 자료 재사용 승인 (가상)" : taskStatus("C-103"))}</td></tr>`).join("");
  const logs = ACCESS_LOG.filter((l): boolean => list.some((c): boolean => c.id === l.contract)).map((l): string => `<tr><td>${esc(l.when)}</td><td>${esc(l.who)}</td><td>${esc(l.what)}</td><td>${esc(l.scope)}</td></tr>`).join("");
  return `<h1>${supplier ? "받은 자료 요청" : "자료 요청·공유"}</h1><p class="sub">${supplier ? "동양알루텍 (가상) 자사 거래의 요청·열람 이력만 표시합니다." : "필요한 항목·이유·기간·받는 사람을 구분합니다."}</p>
    <section class="card"><div class="tbl"><table><thead><tr><th>요청</th><th>항목 / 이유</th><th>기간</th><th>공유 범위</th><th>상태</th></tr></thead><tbody>${body}</tbody></table></div>
      ${!supplier ? `<p><a class="btn pri" href="./start.html?path=B">AL-004 보완·공유 범위 확인</a></p>` : ""}</section>
    <section class="card" style="margin-top:16px"><h2>열람 이력 (가상)</h2><div class="tbl"><table><thead><tr><th>시각</th><th>누가</th><th>무엇을</th><th>범위</th></tr></thead><tbody>${logs}</tbody></table></div><p class="note">역할별 화면을 설명하는 데모입니다. 실제 고객 자료를 보호하려면 서버 인증·권한 검사가 필요하며, 이 화면에 기밀자료를 입력하지 않습니다.</p></section>`;
};
export const packagesView = (role: Role): string => `<h1>제출 패키지 미리보기</h1><p class="sub">${role === "supplier" ? "자사 거래 범위" : "등록 계약 범위"}의 상태와 출처 색인을 담은 검토용 요약입니다.</p>${evidenceView(role)}`;
