/* 신규 약정 검토 예시. AI 호출·실제 문서 업로드 없이 합성자료로만 동작한다. */
import { pct, won } from "../calc";
import { readDemo, saveDemo } from "../demo";
import { esc } from "../ui";

let quantity = "";
let checked = false;
const MATERIAL_UNIT_PRICE = 2800;
const BASE_PRICE = 22000;
const MAX_QUANTITY = BASE_PRICE / MATERIAL_UNIT_PRICE;

export const reviewView = (): string => {
  const s = readDemo();
  if (s.draftApproved) return `<h1>AL-004 · 운영 준비 완료</h1><section class="card"><h2>검토한 산출값과 약정 조건을 저장했습니다</h2><p>구매·공급기업의 확인을 가정한 데모 상태입니다. 법률계약이나 전자서명이 생성된 것은 아닙니다.</p><dl class="calc"><dt>공유 승인된 원재료비</dt><dd>${won(s.draftM0)} / 개</dd><dt>약정 버전</dt><dd>v1.0 (데모 승인)</dd></dl><div class="row"><a class="btn pri" href="#/contracts/AL-004">약정·계산 확인</a><a class="btn" href="#/packages">증빙 요약 보기</a><a class="btn" href="./my.html">내 업무</a></div></section>`;
  const q = Number(quantity);
  const valid = quantity.trim() !== "" && Number.isFinite(q) && q > 0 && q <= MAX_QUANTITY;
  const m0 = valid ? Math.round(q * MATERIAL_UNIT_PRICE) : null;
  return `<div class="between"><div><h1>신규 약정 검토</h1><p class="sub">AL-004 · A정밀 (가상) ↔ 대구캐스팅 (가상) · 다이캐스팅 하우징</p></div><a class="btn" href="#/contracts">목록으로</a></div>
    <div class="journey"><span>01 자료 확인</span><span>02 보완·산출</span><span>03 공유·양사 확인</span><span>04 운영 시작</span></div>
    <p class="note">합성자료로 양사의 검토 절차를 한곳에서 체험합니다. 아래 원가자료 입력은 공급기업 화면의 예시이며, 실제 구매기업에 매입단가·투입량 원문을 공개하는 설계가 아닙니다. AI 분석·기관 검토·서명·메일 전송은 수행하지 않습니다.</p>
    <div class="grid g2"><section class="card"><h2>1. 어떤 근거로 검토하나요?</h2>
      <div class="tbl"><table><thead><tr><th>자료에서 찾은 사실</th><th>출처 (가상)</th><th>확인</th></tr></thead><tbody>
        <tr><td>제조 위탁 · 계약금액 ${won(132000000)}</td><td>계약서 p.1, 3조</td><td>담당자 확인 필요</td></tr>
        <tr><td>거래기간 120일</td><td>계약서 p.2, 5조</td><td>기간 확인 필요</td></tr>
        <tr><td>알루미늄 매입 단가 ${won(MATERIAL_UNIT_PRICE)} / kg</td><td>매입명세 합성자료 p.1</td><td>기간·단위 대조</td></tr>
        <tr><td>제품당 투입량 미확정</td><td>소요량 산출표 p.1</td><td><strong>보완 필요</strong></td></tr>
        <tr><td>위탁기업 규모·적용 법률</td><td>기업 확인자료 미첨부</td><td>추가 검토</td></tr>
      </tbody></table></div>
      <details class="source-preview"><summary>가상 원문 발췌 확인</summary><p>계약서 3조: 하우징 6,000개 × ${won(BASE_PRICE)}.<br>5조: 2026-11-01부터 120일간 제조 위탁.<br>매입명세: 알루미늄 ${won(MATERIAL_UNIT_PRICE)}/kg, 부가세 제외.<br>보완 소요량 산출표: 하우징 1개당 투입량 <b>4kg</b>. 실제 증빙이 아닌 예시입니다.</p></details>
      <p class="note"><b>적용 대상 검토: 추가 자료 필요</b><br>원재료 비중만으로 법적 의무를 확정하지 않습니다. 거래 유형·기업 규모·예외 사유를 담당자가 확인하는 초안을 제공합니다.</p>
    </section><section class="card"><h2>2. 빠진 값만 보완하고 계산합니다</h2>
      <label class="review-field" for="review-quantity">제품당 알루미늄 투입량 (kg/개)<input id="review-quantity" type="number" min="0.01" max="${MAX_QUANTITY}" step="0.01" value="${esc(quantity)}" placeholder="가상 원문 발췌: 4kg"></label>
      <button class="btn" data-review-calc>산출표 초안 계산</button>
      <p id="review-error" class="form-error" role="alert"></p>
      <div class="formula">원재료비 = 투입량 × kg당 매입 단가<br>${valid ? `${esc(quantity)} × ${won(MATERIAL_UNIT_PRICE)} = ${won(m0)}` : "투입량 보완 후 계산합니다"}</div>
      <dl class="calc"><dt>기준 납품단가</dt><dd>${won(BASE_PRICE)} / 개</dd><dt>제품당 원재료비</dt><dd>${won(m0)}</dd><dt>원재료비 비중</dt><dd>${m0 === null ? "산출 전" : pct(m0 / BASE_PRICE)}</dd><dt>계산 기준</dt><dd>부가세 제외 · 원 단위 반올림</dd></dl>
      <p class="note">LLM은 항목·출처 정리를 돕고, 이 계산은 고정된 프로그램이 수행합니다. 여기서 작성하는 것은 검토용 초안이며 전문기관 명의 확인서가 아닙니다.</p>
      <label class="review-check"><input id="review-source" type="checkbox" ${checked ? "checked" : ""}> 보완한 투입량과 단위를 가상 원문 발췌와 대조했습니다</label>
    </section></div>
    <section class="card" style="margin-top:16px"><h2>3. 공개할 결과와 운영 조건 확인</h2>
      <div class="grid g3"><div><b>공급기업 → 구매기업</b><p>원재료비 산정 결과와 적용 산식만 공유합니다. 상세 매입처·매입명세 원문은 공유하지 않습니다.</p></div><div><b>양사 확인할 규칙</b><p>기준지수 100 · 비교지수 106 (가상)<br>±3% 이상 변동 시 월 1회 조정<br>익월 1일 이후 검수분에 적용</p></div><div><b>다음 단계</b><p>운영 현황·내 약정에 동일 버전 반영<br>발주·청구 대조는 별도로 확인<br>계약 종료 후에만 자료를 모을 필요 없이 증빙 요약 확인</p></div></div>
      <label class="review-check"><input id="review-share" type="checkbox"> 공급기업 역할: 산정 결과의 양사 공유 범위를 확인합니다 (데모)</label>
      <label class="review-check"><input id="review-buyer" type="checkbox"> 구매기업 역할: 입력값·산식·주기·적용일을 확인합니다 (데모)</label>
      <label class="review-check"><input id="review-supplier" type="checkbox"> 공급기업 역할: 같은 조건과 약정 버전을 확인합니다 (데모)</label>
      <p class="note">조건 자체가 바뀔 때 양사 확인을 받습니다. 약정대로 매달 계산할 때마다 새 계약을 체결하는 흐름은 아닙니다. 권한 분리와 실제 전자서명은 서버 연동 단계에서 구현합니다.</p>
      <button class="btn pri" data-review-approve ${!valid || !checked ? "disabled" : ""}>데모 양사 확인 후 운영에 반영</button>
      <p id="approval-error" class="form-error" role="alert"></p>
    </section>`;
};

export const handleReview = (target: Element, rerender: () => void): boolean => {
  if (!target.closest("[data-review-calc], [data-review-approve]")) return false;
  const input = document.getElementById("review-quantity") as HTMLInputElement | null;
  const source = document.getElementById("review-source") as HTMLInputElement | null;
  const q = Number(input?.value);
  if (!input?.value.trim() || !Number.isFinite(q) || q <= 0 || q > MAX_QUANTITY) {
    const error = document.getElementById("review-error");
    if (error) error.textContent = "투입량은 0보다 커야 하며, 이 단순 예제에서는 원재료비가 납품단가를 넘지 않도록 입력해 주세요.";
    return true;
  }
  if (target.closest("[data-review-calc]")) {
    quantity = input.value; checked = source?.checked === true; rerender(); return true;
  }
  const approved = ["review-source", "review-share", "review-buyer", "review-supplier"].every((id: string): boolean => (document.getElementById(id) as HTMLInputElement | null)?.checked === true);
  const error = document.getElementById("approval-error");
  if (!approved || input.value !== quantity) {
    if (error) error.textContent = "값을 바꿨다면 다시 계산하고, 원문 대조·공유 범위·양사 확인을 모두 완료해 주세요.";
    return true;
  }
  saveDemo({ setup: "B", draftApproved: true, draftM0: Math.round(q * MATERIAL_UNIT_PRICE) });
  rerender(); return true;
};
