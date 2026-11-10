/* 조정 차액 정산 실증 — 본 서비스와 분리된 테스트넷 데모 */
import { adjust, won } from "../calc";
import type { AppState } from "../types";
import { findContract, pill } from "../ui";

export const settlementView = (): string => {
  const c = findContract("AL-001");
  if (!c) return `<div class="card empty">실증용 계약이 없습니다</div>`;
  const r = adjust(c);
  return `
    <h1>조정 차액 정산 실증 <span class="tag">독립 데모 · 테스트넷</span></h1>
    <p class="sub">본 서비스와 분리된 실증입니다. 승인된 지급명세와 예치된 테스트 토큰을 한 번만 지급합니다.</p>
    <div class="grid g2">
      <section class="card">
        <h2>지급명세 PS-0001</h2>
        <dl class="calc">
          <dt>연결 계산</dt><dd>${c.id} · calc-11</dd>
          <dt>금액 (테스트 토큰)</dt><dd>${won(r.total)}</dd>
          <dt>승인자</dt><dd class="mono">0x8b2e…A정밀(가상)</dd>
          <dt>수취인</dt><dd class="mono">0x41fa…동양알루텍(가상)</dd>
          <dt>버전</dt><dd>v1</dd>
          <dt>네트워크</dt><dd>Kaia Kairos (테스트넷) · 수수료 대납 검토</dd>
        </dl>
        <div class="hash" style="margin-top:12px">commitment: 0x7f3a9c51d0e8…e21b</div>
        <div class="row" style="margin-top:14px">
          <button class="btn" id="btn-deposit" type="button">① 테스트 토큰 예치</button>
          <button class="btn pri" id="btn-pay" type="button" disabled>② 지급 실행</button>
        </div>
        <div id="pay-state" style="margin-top:12px">${pill("p-mute", "예치 전 · 지급보장 아님")}</div>
      </section>
      <section class="card">
        <h2>체인에 남는 것 / 남지 않는 것</h2>
        <div class="tbl"><table><tbody>
          <tr><td>지급명세 ID · commitment · 버전</td><td>${pill("p-ok", "기록")}</td></tr>
          <tr><td>승인 주소 · 금액 · 상태</td><td>${pill("p-ok", "기록 (공개)")}</td></tr>
          <tr><td>약정 원문 · 원가 자료</td><td>${pill("p-mute", "기록 안 함")}</td></tr>
        </tbody></table></div>
        <p class="note">공개 체인에서는 주소와 금액이 보이므로 합성자료로만 시연합니다. 원가 판단이나 실물 검수 진위를 체인이 보증하지 않습니다.</p>
      </section>
    </div>`;
};

/** 현재 상태를 실증 화면의 버튼·배지에 반영한다. */
export const syncSettlement = (state: AppState): void => {
  const box = document.getElementById("pay-state");
  const deposit = document.getElementById("btn-deposit");
  const pay = document.getElementById("btn-pay");
  if (!(box && deposit instanceof HTMLButtonElement && pay instanceof HTMLButtonElement)) return;
  if (state.paid) box.innerHTML = pill("p-ok", "지급 완료 · tx 0x05a6…221f (가상)");
  else if (state.deposited) box.innerHTML = pill("p-info", "예치 완료 · 지급 가능");
  deposit.disabled = state.deposited;
  pay.disabled = !state.deposited || state.paid;
};
