/* 기업 대시보드: 약정 목록 · 약정 상세 */
import { adjust, pct, signedWon, won } from "../calc";
import { CONTRACTS, TRAILS } from "../data";
import type { Contract } from "../types";
import { applyFrom, esc, findContract, supplierName } from "../ui";

const STATUS: Readonly<Record<Contract["status"], readonly [string, string]>> = {
  ok: ["ok", "운영 중"],
  renew: ["warn", "갱신 필요"],
  draft: ["info", "체결 전"],
  nolink: ["mute", "미연동 합의"],
};

const statusTag = (c: Contract): string => {
  const [tone, label] = STATUS[c.status];
  return `<span class="state ${tone}">${label}</span>`;
};

const priceNow = (c: Contract): string => {
  if (c.status === "nolink") return "-";
  const r = adjust(c);
  if (!r.triggered) return won(c.p0);
  return c.status === "draft" ? `${won(r.price)} <small>예상</small>` : won(r.price);
};

export const contractsScreen = (): string => {
  const rows = CONTRACTS.map((c) => `<tr data-detail="${esc(c.id)}" class="link-row">
      <td class="mono-cell">${esc(c.id)}</td>
      <td><b>${esc(c.item)}</b></td>
      <td>${esc(supplierName(c.supplier))}</td>
      <td>${esc(c.material)}</td>
      <td>${statusTag(c)}</td>
      <td class="n">${won(c.p0)}</td>
      <td class="n">${priceNow(c)}</td>
      <td class="n">${esc(c.end)}</td></tr>`).join("");
  return `
    <header class="page-h"><div><h1>약정</h1><p>공급사 ${CONTRACTS.length}곳 · 11월 지표 기준</p></div>
      <button class="btn solid sm" data-toast="약정서 올리기 화면은 파일럿 신청에서 체험할 수 있습니다 (데모)">약정서 올리기</button></header>
    <section class="panel">
      <table class="grid"><thead><tr><th>약정번호</th><th>품목</th><th>공급사</th><th>원재료 (비중)</th><th>상태</th><th class="n">기준 단가</th><th class="n">11월 단가</th><th class="n">계약 종료</th></tr></thead>
        <tbody>${rows}</tbody></table>
    </section>`;
};

const conditions = (c: Contract): string => `
  <section class="panel"><h2>약정 조건</h2>
    <dl class="facts">
      <dt>원재료 (비중)</dt><dd>${esc(c.material)}</dd>
      <dt>기준 지표</dt><dd>${esc(c.index)} · 기준값 ${c.i0}</dd>
      <dt>조정 요건</dt><dd>지표 ±${c.threshold}% 이상 변동 시</dd>
      <dt>확인 주기</dt><dd>${esc(c.cycle)}</dd>
      <dt>적용 시점</dt><dd>${esc(c.applyDay)}<small>이번 조정: ${esc(applyFrom(c.applyDay))}</small></dd>
      <dt>제품당 원재료비</dt><dd>${won(c.m0)}</dd>
      <dt>계약 종료</dt><dd>${esc(c.end)}</dd>
      <dt>약정 버전</dt><dd>${esc(c.version)}</dd>
    </dl></section>`;

const calcPanel = (c: Contract): string => {
  const r = adjust(c);
  const verdict = !r.triggered
    ? `변동률 ${pct(r.rate)}로 요건(±${c.threshold}%) 미달. 단가 유지.`
    : `변동률 ${pct(r.rate)}로 요건(±${c.threshold}%) 충족. 원재료비 ${won(c.m0)}에 변동률 반영.`;
  return `<section class="panel"><h2>11월 계산 내역</h2>
    <table class="grid compact"><tbody>
      <tr><td>지표</td><td class="n">${c.i0} → ${r.it}</td></tr>
      <tr><td>산식</td><td class="n formula">${c.p0.toLocaleString()} + ${c.m0.toLocaleString()} × (${r.it} − ${c.i0}) ÷ ${c.i0}</td></tr>
      <tr><td>판정</td><td class="n">${verdict}</td></tr>
      <tr><td>적용</td><td class="n">${esc(applyFrom(c.applyDay))}</td></tr>
      <tr><td>근거</td><td class="n"><button class="link" data-toast="${esc(c.index)} 11월 공표값 화면을 엽니다 (데모)">지표 출처 보기</button> · <button class="link" data-toast="약정서 ${esc(c.version)} 제5조(조정 요건) 원문을 엽니다 (데모)">약정서 제5조 보기</button></td></tr>
    </tbody></table></section>`;
};

const trailPanel = (id: string): string => {
  const t = TRAILS.find((x) => x.contract === id);
  if (!t) return "";
  return `<section class="panel"><h2>처리 기록</h2>
    <table class="grid compact"><tbody>
      <tr><td>등록</td><td>${esc(t.uploaded)}</td></tr>
      <tr><td>상대 확인</td><td>${esc(t.checked)}</td></tr>
      <tr><td>승인</td><td>${esc(t.approved ?? "대기")}</td></tr>
    </tbody></table></section>`;
};

const figures = (c: Contract): string => {
  if (c.status === "nolink") {
    return `<section class="figures"><div><span>연동 여부</span><b>미연동 합의</b></div>
      <div><span>합의일</span><b>${esc(c.noLink?.agreedOn)}</b></div>
      <div class="wide"><span>사유</span><b>${esc(c.noLink?.reason)}</b></div>
      <div class="wide"><span>보관 문서</span><b>${esc(c.noLink?.doc)}</b></div></section>`;
  }
  const r = adjust(c);
  const draft = c.status === "draft";
  return `${draft ? `<p class="notice-bar">약정 체결 전입니다. 아래 금액은 초안 조건으로 계산한 예상치이며, 지급 근거가 되지 않습니다.</p>` : ""}
    <section class="figures">
      <div><span>기준 단가</span><b>${won(c.p0)}</b></div>
      <div><span>11월 단가${draft ? " (예상)" : ""}</span><b class="${r.diffPerUnit > 0 ? "up" : r.diffPerUnit < 0 ? "down" : ""}">${won(r.price)}</b></div>
      <div><span>개당 차이</span><b>${r.triggered ? signedWon(r.diffPerUnit) : "-"}</b></div>
      <div><span>적용 수량 ${c.qty.toLocaleString()}개 기준</span><b>${r.triggered ? signedWon(r.total) : "-"}</b></div>
    </section>`;
};

export const detailScreen = (id: string): string => {
  const c = findContract(id);
  if (!c) return `<p>약정을 찾을 수 없습니다.</p>`;
  const body = c.status === "nolink"
    ? `<div class="cols"><div class="col-main">${trailPanel(c.id)}</div><aside class="col-side"></aside></div>`
    : `<div class="cols"><div class="col-main">${calcPanel(c)}${conditions(c)}</div><aside class="col-side">${trailPanel(c.id)}</aside></div>`;
  return `
    <button class="back" data-tab="contracts">‹ 약정 목록</button>
    <header class="page-h"><div><h1>${esc(c.item)} ${statusTag(c)}</h1><p>${esc(c.id)} · ${esc(supplierName(c.supplier))}</p></div>
      <button class="btn ghost sm" data-toast="변동표를 내려받았습니다 (데모)">변동표 내려받기</button></header>
    ${figures(c)}
    ${body}`;
};
