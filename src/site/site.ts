/* 서비스 소개 페이지: 첫 화면 알림 예시 */
import "./site.css";
import { adjust, won } from "../calc";
import { findContract } from "../ui";
import { RECONCILE } from "../data";

const ALERT_CONTRACT = "AL-001";
const RENEW_CONTRACT = "ST-005";

/** 첫 화면 알림 예시: 기업 대시보드와 같은 가상 데이터로 문장을 만든다 */
const renderInbox = (): void => {
  const box = document.getElementById("inbox-msgs");
  const c = findContract(ALERT_CONTRACT);
  const renew = findContract(RENEW_CONTRACT);
  const po = RECONCILE.find((x) => x.contract === ALERT_CONTRACT);
  if (!box || !c || !renew || !po) return;
  const r = adjust(c);
  const rise = Math.round(r.rate * 100);
  const loss = (r.price - po.poPrice) * po.qty;
  box.innerHTML = `
    <article class="msg">
      <div class="msg-top"><b>Faccon 단가 알림</b><span>11월 1일 오전 8:30</span></div>
      <p>알루미늄 지수가 지난달보다 ${rise}% 올라서 ${c.item} 단가가 <span class="num">${won(c.p0)}</span>에서 <span class="num">${won(r.price)}</span>으로 바뀝니다.</p>
      <p>그런데 11월 발주서(${po.po})는 아직 ${won(po.poPrice)}으로 나갔어요. 그대로 두면 ${po.qty.toLocaleString()}개 기준 <span class="loss">${won(loss)}</span>이 덜 지급됩니다.</p>
      <a href="./login.html">대시보드에서 확인하기 ›</a>
    </article>
    <article class="msg old">
      <div class="msg-top"><b>Faccon 계약 알림</b><span>11월 3일 오전 9:00</span></div>
      <p>${renew.item} 계약이 10월 31일에 끝났는데 발주가 2건 더 나갔습니다. 계약을 연장하셨다면 연동약정도 같이 갱신해 주세요.</p>
    </article>`;
};

renderInbox();
