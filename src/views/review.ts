import { pct, won } from "../calc";
import { activeSupplier } from "../context";
import { readWork } from "../workflow";
import { esc } from "../ui";
import type { Role } from "../types";
import { workButton, workCheck, workTrail } from "./work-panels";

export const reviewView = (role: Role): string => {
  const w = readWork();
  if (role === "supplier" && activeSupplier() !== "S-04") return `<h1>신규 약정 준비</h1><section class="card"><p>선택한 회사의 요청이 아닙니다. AL-004 실습은 아래 회사 선택에서 대구캐스팅 (가상)을 선택해 주십시오.</p></section>`;
  const labels = { draft: "구매기업 보완 요청 전", requested: "공급기업 자료 보완 대기", submitted: "구매기업 결과 확인 대기", returned: "공급기업 재제출 대기", active: "양사 확인 완료·운영 중" };
  let body = "";
  if (w.phase === "active") body = `<h2>같은 약정 v1.0을 양사가 확인했습니다</h2><p>원재료비 ${won(w.m0)} · 기준지수 100 · 월 1회 ±3% · 익월 1일 이후 검수분 적용.</p><a class="btn pri" href="#/reconcile">발주·청구·지급근거 처리로 이동</a><a class="btn" href="#/contracts/AL-004">약정 상세</a>`;
  else if (role === "buyer") {
    body = `<h2>구매기업이 확인할 내용</h2><p>제조 위탁 계약 132,000,000원 · 거래기간 120일 · AL-004. 거래 유형·기업 규모·예외 여부는 담당자가 추가 검토합니다. 원재료 비중만으로 법적 의무를 확정하지 않습니다.</p>`;
    if (w.phase === "draft") body += `<p>공급기업이 보유한 소요량 산출표의 제품당 투입량을 보완 요청합니다. 구매기업에는 승인된 산정 결과만 전달됩니다.</p>${workButton("request", "대구캐스팅에 보완 요청 (가상)")}`;
    if (["requested", "returned"].includes(w.phase)) body += `<p>대구캐스팅의 회신을 기다립니다. 아래 공급기업 체험 링크에서 같은 요청을 처리할 수 있습니다.</p><a class="btn" href="./app.html?role=supplier&supplier=S-04#/review">대구캐스팅으로 요청 확인 →</a>`;
    if (w.phase === "submitted") body += `<dl class="calc"><dt>공유 승인된 원재료비</dt><dd>${won(w.m0)} / 개</dd><dt>납품단가 대비 비중</dt><dd>${pct(w.m0 / 22000)}</dd><dt>공유 범위</dt><dd>${w.scope === "summary" ? "산정 결과 + 근거 문서 종류·기준월" : "산정 결과만"}</dd><dt>제출 버전</dt><dd>제출 ${w.revision}차</dd></dl>${w.scope === "summary" ? "<p>근거 요약: 2026년 10월 매입명세·소요량 산출표. 상세 매입처·투입량 원문은 표시하지 않습니다.</p>" : ""}<p>양사 합의 규칙: 기준단가 22,000원, 지표 기준 100, 월 1회 ±3%, 익월 1일 이후 검수분에 적용.</p>${workCheck("공급기업이 승인한 이번 제출 결과와 위 약정 조건을 확인했습니다")}${workButton("approve", "확인한 버전으로 약정 운영 시작")}<label class="review-field">보완 요청 사유<textarea id="work-note" maxlength="300" placeholder="예: 기준월을 확인해 주십시오."></textarea></label>${workButton("return", "사유와 함께 보완 요청")}`;
  } else {
    body = `<h2>대구캐스팅이 받은 요청</h2><p>요청자: A정밀 (가상) · 자료: 제품당 투입량 · 목적: 원재료비 비중·산정 결과 확인. 공급기업 원문은 구매기업 화면에 표시하지 않습니다.</p>`;
    if (w.phase === "draft") body += "<p>아직 구매기업 요청이 없습니다. 구매기업 역할에서 보완 요청을 시작합니다.</p>";
    if (w.phase === "submitted") body += `<p>산정 결과 ${won(w.m0)}를 공유 승인했습니다. 구매기업 확인을 기다립니다.</p>`;
    if (["requested", "returned"].includes(w.phase)) body += `${w.note ? `<p role="status">보완 요청: ${esc(w.note)}</p>` : ""}<details open><summary>가상 원문과 산출 근거</summary><p>매입명세 p.1: 알루미늄 2,800원/kg, 부가세 제외.<br>소요량 산출표 p.1: 제품당 4kg. 원재료비 = 4 × 2,800 = 11,200원 (50.91%).</p></details><label class="review-field">원문과 대조한 투입량 (kg/개)<input id="work-quantity" type="number" step="0.01" min="0.01" max="7.85" placeholder="가상 원문: 4"></label><button class="btn" data-work-preview>산정 결과 미리보기</button><div id="work-preview" role="status">투입량을 입력하고 미리보기를 확인해 주십시오.</div><label class="review-field">구매기업에 공유할 범위<select id="work-scope"><option value="result">산정 결과만</option><option value="summary">산정 결과 + 근거 문서 종류·기준월</option></select></label><p>제출 시 고정 산식으로 계산합니다. 공유하는 항목: 원재료비·비중·약정 조건. 상세 매입처·원문·투입량은 구매기업 화면에 표시하지 않습니다. 결과로부터 일부 원가를 추론할 가능성까지 없애는 구조는 아닙니다.</p><p>승인할 규칙: 기준단가 22,000원, 기준지수 100, 월 1회 ±3%, 익월 1일 이후 검수분 적용.</p>${workCheck("원문·단위·공유 범위·약정 조건을 확인하고 이 결과의 제출에 동의합니다 (가상)")}${workButton("submit", "계산 결과 확인·공유 승인하여 제출")}`;
  }
  return `<h1>AL-004 신규 약정 준비</h1><p class="sub">A정밀 (가상) ↔ 대구캐스팅 (가상) · ${labels[w.phase]}</p><div class="journey"><span>01 구매기업 요청</span><span>02 공급기업 보완·공유 승인</span><span>03 구매기업 버전 확인</span><span>04 운영·반영·증빙</span></div><p class="note">양쪽 역할로 한 거래를 끝까지 체험합니다. 현재는 가상 데이터·브라우저 저장이며 실제 인증·파일·AI 분석·서명·전송은 없습니다. 서버 권한을 구현한 서비스가 아닙니다.</p><section class="card">${body}<p id="work-error" role="alert"></p></section>${workTrail("AL-004")}`;
};
