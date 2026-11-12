import { adjust, won } from "../calc";
import type { AppState } from "../types";
import { esc, findContract, pill } from "../ui";

export const settlementView = (): string => {
  const c = findContract("AL-001");
  if (!c) return `<p>시연 계약이 없습니다.</p>`;
  const r = adjust(c);
  return `<h1>조정 차액 지급 시뮬레이션</h1><p class="sub">실제 체인·지갑 연결 없음 · 테스트넷 거래가 발생하지 않습니다.</p>
    <div class="journey"><span>확인된 산출표</span><span>지급명세 확인</span><span>가상 예치</span><span>1회 지급 상태 전환</span></div>
    <div class="grid g2"><section class="card"><h2>PS-0001 · 계산 결과에 연결된 지급명세</h2><dl class="calc"><dt>대상</dt><dd>${esc(c.id)} · ${esc(c.version)} · calc-11</dd><dt>기준 차액 (원화 참고)</dt><dd>${won(r.total)}</dd><dt>시뮬레이션 수량</dt><dd>${r.total.toLocaleString()} DEMO</dd><dt>지급자 / 수취인</dt><dd>A정밀 (가상) → 동양알루텍 (가상)</dd><dt>네트워크</dt><dd>미연결 · 향후 Kairos 검증 예정</dd></dl>
      <p>지급명세를 확인하고 가상 예치를 해야 실행할 수 있습니다. 같은 명세의 지급은 두 번 실행할 수 없습니다.</p>
      <label class="review-check"><input id="pay-consent" type="checkbox"> 대상·버전·금액·수취인을 확인합니다 (데모)</label>
      <div class="row"><button class="btn" id="btn-deposit">① 가상 예치</button><button class="btn pri" id="btn-pay" disabled>② 가상 지급 실행</button></div><p id="pay-state"></p></section>
    <section class="card"><h2>이 기능이 보여주는 것</h2><p>합의한 계산 결과와 지급명세를 연결해, 잘못된 금액이나 동일 명세의 중복 실행을 막는 흐름을 검증합니다.</p>
      <table><thead><tr><th>향후 온체인 기록 설계</th><th>비공개 보관</th></tr></thead><tbody><tr><td>명세 ID · 버전 · commitment<br>승인 주소 · 토큰 금액 · 지급 상태</td><td>계약서 · 원가자료<br>계산 근거 원문</td></tr></tbody></table>
      <p class="note">현재 중복 방지는 이 브라우저의 데모 상태에 한정됩니다. 실제 스마트컨트랙트 배포·서명 검증·동시 요청 테스트는 별도 구현 과제입니다. 이 화면의 지급은 ERP 지급근거로 집계하지 않습니다.</p></section></div>`;
};
export const syncSettlement = (state: AppState): void => {
  const box = document.getElementById("pay-state");
  const deposit = document.getElementById("btn-deposit");
  const pay = document.getElementById("btn-pay");
  const consent = document.getElementById("pay-consent");
  if (!(box && deposit instanceof HTMLButtonElement && pay instanceof HTMLButtonElement && consent instanceof HTMLInputElement)) return;
  box.innerHTML = pill(state.paid ? "p-ok" : "p-info", state.paid ? "시뮬레이션 완료 · 동일 명세 재실행 차단" : state.deposited ? "가상 예치됨 · 명세 확인 후 실행" : "예치 전");
  deposit.disabled = state.deposited;
  pay.disabled = !state.deposited || state.paid || !consent.checked;
  consent.disabled = state.paid;
};
