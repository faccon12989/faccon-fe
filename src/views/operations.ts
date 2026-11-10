/* 반영 대조 · 자료 요청 · 제출 패키지 */
import { adjust, signedWon, won } from "../calc";
import { ACCESS_LOG, PACKAGES, RECONCILE, REQUESTS, SELF_SUPPLIER } from "../data";
import type { Role } from "../types";
import { esc, findContract, pill, supplierName, visibleContracts } from "../ui";

const STAGES = ["산출", "발주 반영", "청구", "지급근거"] as const;

export function reconcileView(role: Role): string {
  const list = visibleContracts(role);
  const rows = RECONCILE.flatMap((row) => {
    const c = findContract(row.contract);
    if (!c || !list.includes(c)) return [];
    const r = adjust(c);
    const gap = (r.price - row.poPrice) * row.qty;
    const stage = 1 + Number(row.poPrice === r.price) + Number(row.invPrice === r.price) + Number(row.paid);
    const state = gap !== 0 ? pill("p-bad", "미반영") : row.paid ? pill("p-ok", "지급근거 확인") : pill("p-warn", "수령 확인 전");
    const ask = gap !== 0 && role === "buyer" ? ` <button class="btn" data-toast="담당자 확인 요청을 보냈습니다 (데모)">확인 요청</button>` : "";
    return [`<tr><td><b>${esc(c.id)}</b><br><small style="color:var(--mute)">${esc(supplierName(c.supplier))}</small></td>
      <td class="mono">${esc(row.po)}</td><td class="num">${won(r.price)}</td><td class="num">${won(row.poPrice)}</td>
      <td class="num ${gap ? "diff-up" : "diff-ok"}">${gap ? signedWon(gap) : "일치"}</td>
      <td><div class="track">${STAGES.map((_, i) => `<span class="${i < stage ? "on" : ""}"></span>`).join("")}</div>
        <div class="track-lbl">${STAGES.map((s) => `<span>${s}</span>`).join("")}</div></td>
      <td>${state}${ask}</td></tr>`];
  }).join("");
  return `
    <h1>발주·청구 반영 대조</h1>
    <p class="sub">계산된 조정단가와 ERP에서 가져온 발주·청구 단가를 비교합니다 (가상 ERP 파일 PO_2026-11.csv)</p>
    <div class="card"><div class="tbl"><table>
      <thead><tr><th>계약</th><th>발주번호</th><th class="num">계산단가</th><th class="num">발주단가</th><th class="num">차이 × 수량</th><th style="width:220px">진행</th><th>상태</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="7" class="empty">대조할 발주가 없습니다</td></tr>`}</tbody></table></div>
      <p class="note">조정 계산이 끝났다고 수령 완료가 아닙니다. 입금 또는 지급명세 근거가 없으면 “수령 확인 전”으로 표시합니다.</p></div>`;
}

export function requestsView(role: Role): string {
  const isSupplier = role === "supplier";
  // 데모 편의: 공급기업 화면에서도 S-04 요청을 함께 보여준다.
  const rows = isSupplier ? REQUESTS.filter((q) => q.supplier === SELF_SUPPLIER || q.supplier === "S-04") : REQUESTS;
  const body = rows.map((q) => `<tr>
    <td><b>${esc(q.id)}</b><br><small style="color:var(--mute)">${esc(q.contract)} · ${esc(supplierName(q.supplier))}</small></td>
    <td>${esc(q.item)}<br><small style="color:var(--soft)">${esc(q.why)}</small></td>
    <td>${esc(q.period)}</td><td>${esc(q.to)}</td>
    <td>${q.reuse ? `${pill("p-ok", "재사용")}<br><small>${esc(q.reuse)}</small>` : pill("p-warn", q.state)}</td>
    <td>${isSupplier && !q.reuse ? `<button class="btn pri" data-toast="원문은 공급기업 전용 저장소에 올라갑니다 (데모)">제출</button>` : ""}</td></tr>`).join("");
  const log = ACCESS_LOG.map((l) => `<tr><td class="mono">${esc(l.when)}</td><td>${esc(l.who)}</td><td>${esc(l.what)}</td>
    <td>${l.scope.startsWith("차단") ? pill("p-bad", l.scope) : esc(l.scope)}</td></tr>`).join("");
  const demoNote = isSupplier
    ? `<div class="lock" style="margin-bottom:14px"><span aria-hidden="true">👁</span><div>데모 편의를 위해 공급기업 화면에 S-04 요청도 함께 보여줍니다. 실제로는 자사 요청만 보입니다.</div></div>`
    : "";
  return `
    <h1>${isSupplier ? "받은 자료 요청" : "자료 요청·공유"}</h1>
    <p class="sub">필요한 항목만, 이유와 기간·수신자를 밝혀 요청합니다. 상세 원가 원문은 공급기업 전용입니다.</p>
    ${demoNote}
    <div class="card"><div class="tbl"><table>
      <thead><tr><th>요청</th><th>항목 · 필요 이유</th><th>기간</th><th>공유 범위</th><th>상태</th><th></th></tr></thead>
      <tbody>${body}</tbody></table></div></div>
    <section class="card" style="margin-top:16px"><h2>${isSupplier ? "우리 자료 열람 이력" : "열람 이력"}</h2>
      <div class="tbl"><table><thead><tr><th>시각</th><th>누가</th><th>무엇을</th><th>범위</th></tr></thead>
      <tbody>${log}</tbody></table></div></section>`;
}

export function packagesView(role: Role): string {
  if (role === "supplier") {
    return `<h1>제출 패키지</h1><div class="card empty">제출 패키지는 구매기업이 목적별로 만들고, 공급기업 자료는 공유 승인된 범위만 포함됩니다.</div>`;
  }
  const cards = PACKAGES.map((p) => `<section class="card" style="margin-bottom:16px">
    <div class="between"><h2>${esc(p.purpose)} <span class="tag">${esc(p.year)}</span></h2>
      <div class="row">${pill(p.state === "초안" ? "p-info" : "p-warn", p.state)}
      <button class="btn" data-toast="PDF·엑셀 내보내기는 데모에서 생략했습니다">내보내기</button></div></div>
    <div class="tbl"><table><thead><tr><th>요청 항목</th><th>산출값</th><th>집계 근거</th><th>근거 파일</th></tr></thead>
    <tbody>${p.rows.map((r) => `<tr><td><b>${esc(r.req)}</b></td><td>${esc(r.value)}</td><td>${esc(r.basis)}</td><td class="mono">${esc(r.file)}</td></tr>`).join("")}</tbody></table></div>
  </section>`).join("");
  return `
    <h1>제출 패키지</h1>
    <p class="sub">요청 항목 → 산출값 → 근거 파일·페이지·버전. 기관 담당자는 지갑 없이 PDF·엑셀로 읽습니다.</p>
    ${cards}
    <p class="note">체결 비율은 등록된 계약 기준입니다. 미등록 계약이 있으면 회사 전체 비율로 표시하지 않습니다. 실적 인정은 기관의 판단입니다.</p>`;
}
