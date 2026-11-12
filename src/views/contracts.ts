import { adjust, pct, signedWon, won } from "../calc";
import { INDEX_SERIES, MONTHS } from "../data";
import type { AdjustResult, Contract, Role } from "../types";
import { adjustPill, esc, findContract, statusPill, supplierName, visibleContracts } from "../ui";

const STEPS = ["등록", "검토", "보완", "약정", "모니터링", "조정·반영", "이력", "제출"] as const;

export const contractsView = (role: Role): string => {
  const actions = role === "buyer"
    ? `<div class="row"><a class="btn" href="./start.html?path=A">기존 약정 가져오기</a><a class="btn pri" href="./start.html?path=B">신규 약정 검토</a></div>`
    : "";
  const rows = visibleContracts(role).map((c) => `
    <tr class="click" data-go="#/contracts/${esc(c.id)}">
      <td><b>${esc(c.id)}</b></td><td>${esc(supplierName(c.supplier))}</td>
      <td>${esc(c.item)}<br><small style="color:var(--mute)">${esc(c.material)}</small></td>
      <td><span class="tag">${c.path === "A" ? "A 기존 약정" : "B 신규 준비"}</span></td>
      <td>${esc(c.cycle)}</td><td class="mono">${esc(c.version)}</td><td class="mono">${esc(c.end)}</td><td>${statusPill(c.status)}</td>
    </tr>`).join("");
  return `
    <div class="between"><div><h1>연동약정</h1><p class="sub">기존 약정을 가져와 운영(A)하거나, 신규 약정을 준비(B)합니다</p></div>${actions}</div>
    <div class="card"><div class="tbl"><table>
      <thead><tr><th>계약</th><th>공급기업</th><th>품목 / 원재료</th><th>경로</th><th>주기</th><th>버전</th><th>계약 종료</th><th>상태</th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
};

const indexChart = (series: readonly number[], threshold: number): string => {
  const W = 520, H = 170, PAD = 28;
  const min = Math.min(92, ...series);
  const max = Math.max(110, ...series);
  const x = (i: number): number => PAD + (i * (W - PAD * 2)) / Math.max(series.length - 1, 1);
  const y = (v: number): number => H - PAD - ((v - min) * (H - PAD * 2)) / (max - min);
  const band = (v: number): string => `<line x1="${PAD}" x2="${W - PAD}" y1="${y(v)}" y2="${y(v)}" stroke="#C9C3B6" stroke-dasharray="4 4"/>`;
  const points = series.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const dots = series.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="#0F766E"/><text x="${x(i) - 10}" y="${H - 8}">${esc(MONTHS[i])}</text>`).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="지표 관측값 추이, 기준 100, 요건 ±${threshold}%">
    ${band(100 + threshold)}${band(100 - threshold)}
    <line x1="${PAD}" x2="${W - PAD}" y1="${y(100)}" y2="${y(100)}" stroke="#9AA6A8"/>
    <text x="${W - PAD + 2}" y="${y(100) + 4}">100</text>
    <text x="${W - PAD + 2}" y="${y(100 + threshold) + 4}">+${threshold}%</text>
    <text x="${W - PAD + 2}" y="${y(100 - threshold) + 4}">-${threshold}%</text>
    <polyline points="${points}" fill="none" stroke="#0F766E" stroke-width="2.5"/>${dots}
  </svg>`;
};

export const resultBlock = (c: Readonly<Contract>, r: AdjustResult): string => {
  const cls = !r.triggered ? "flat" : r.diffPerUnit < 0 ? "down" : "";
  return `<div class="result ${cls}">
    <div><small>원재료 지표 변동률</small><br><b>${pct(r.rate)}</b></div>
    <div><small>${c.status === "draft" ? "초안 예상 단가 · 미확정" : c.status === "renew" ? "종료 약정 참고 단가" : "산출 단가 · 반영 확인 별도"}</small><br><b>${won(r.price)}</b><small> · 단가 ${pct(r.diffPerUnit / c.p0)}</small></div>
    <div><small>차액 (× ${c.qty.toLocaleString()}개)</small><br><b>${r.triggered ? signedWon(r.total) : "조정 없음"}</b></div>
    <div>${adjustPill(r)}</div></div>`;
};

export const contractDetailView = (role: Role, id: string): string => {
  const c = findContract(id);
  if (!c || !visibleContracts(role).some((item: Contract): boolean => item.id === c.id)) return `<div class="card empty">볼 수 있는 계약이 아닙니다</div>`;
  const r = adjust(c);
  const steps = STEPS.map((s, i) => {
    const n = i + 1;
    const cls = n < c.stepNow ? "done" : n === c.stepNow ? "now" : "";
    return `<div class="${cls}"><b>0${n}</b>${s}</div>`;
  }).join("");
  const m0Shown = role === "supplier" || c.path === "A" ? won(c.m0) : "공유 승인 전";
  if (c.status === "draft") return `<h1>${esc(c.id)} · 신규 약정 준비</h1><section class="card"><h2>투입량 보완 및 양사 확인 전입니다</h2><p>초안 값을 확정 단가로 적용하지 않습니다. 근거 자료 확인과 산출표 검토를 먼저 진행해 주세요.</p><a class="btn pri" href="./start.html?path=B">자료 검토·산출표 열기</a></section>`;
  const lock = role === "buyer"
    ? `<div class="lock" style="margin-top:14px"><span aria-hidden="true">🔒</span><div>공급기업 원가 원문(매입처·상세 단가)은 기본 비공개입니다. 구매기업은 양사가 합의한 산정 결과만 봅니다.</div></div>`
    : "";

  return `
    <div class="between"><div><h1>${esc(c.id)} · ${esc(c.item)}</h1>
      <p class="sub">${esc(supplierName(c.supplier))} · ${esc(c.material)} · 약정 ${esc(c.version)} ${statusPill(c.status)}</p></div>
      <a class="btn" href="#/contracts">← 목록</a></div>
    <div class="steps" aria-label="진행 단계">${steps}</div>
    <div class="grid g2">
      <section class="card">
        <h2>약정 조건</h2>
        <dl class="calc">
          <dt>기준 납품단가 P0</dt><dd>${won(c.p0)} <span class="src">약정서 p.2 표1</span></dd>
          <dt>제품당 원재료비 M0</dt><dd>${m0Shown} <span class="src">비중 확인서</span></dd>
          <dt>기준 지표 I0</dt><dd>${c.i0} <span class="src">${esc(c.index)}</span></dd>
          <dt>조정 요건</dt><dd>±${c.threshold}% 이상 · ${esc(c.cycle)}</dd>
          <dt>적용 기준</dt><dd>${esc(c.applyDay)}</dd>
          <dt>적용 수량 Q</dt><dd>${c.qty.toLocaleString()}개</dd>
        </dl>
        <div class="formula" style="margin-top:14px">Pt = P0 + M0 × (It − I0) ÷ I0<br>
          = ${c.p0.toLocaleString()} + ${c.m0.toLocaleString()} × (<b id="f-it">${r.it}</b> − ${c.i0}) ÷ ${c.i0}</div>
        <div class="slider"><label for="it">비교 지표 It</label>
          <input type="range" id="it" min="85" max="115" step="0.5" value="${r.it}" data-contract="${esc(c.id)}">
          <output id="it-out" for="it">${r.it}</output></div>
        <div id="calc-result">${resultBlock(c, r)}</div>
        <p class="note">계산은 고정된 규칙 엔진이 합니다 (LLM 미사용). 같은 입력이면 항상 같은 결과가 나옵니다. 부가세 제외 가상 예시.</p>
      </section>
      <section class="card">
        <h2>지표 관측값</h2>
        ${indexChart(INDEX_SERIES[c.id] ?? [], c.threshold)}
        <h2 style="margin-top:18px">버전·승인 이력</h2>
        <div class="tbl"><table><tbody>
          <tr><td class="mono">${esc(c.version)}</td><td>${c.status === "renew" ? "종료 약정 · 갱신 확인 필요" : "현재 약정"}</td><td>가상 승인 이력</td></tr>
          <tr><td class="mono">v1.0</td><td>최초 약정 (전문기관 확인서 반영)</td><td><span class="pill p-mute">대체됨</span></td></tr>
          <tr><td class="mono">calc-11</td><td>11월 계산 실행 · 규칙 v2026.10</td><td><span class="pill p-ok">기록됨</span></td></tr>
        </tbody></table></div>
        ${lock}
      </section>
    </div>`;
};
