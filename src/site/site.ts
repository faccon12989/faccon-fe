/* 서비스 소개 페이지: 첫 화면 알림 예시 (실제 업무 알림처럼 항목: 값 형식) */
import "./site.css";
import { adjust, won } from "../calc";
import { RECONCILE } from "../data";
import { esc, findContract } from "../ui";

const ALERT_CONTRACT = "AL-001";
const RENEW_CONTRACT = "ST-005";

type Row = readonly [label: string, value: string, tone?: "new" | "warn"];

const rowsHtml = (rows: readonly Row[]): string => rows
  .map(([label, value, tone]) => `<li><span>${esc(label)}</span><b class="${tone ?? ""}">${esc(value)}</b></li>`)
  .join("");

const bubble = (title: string, rows: readonly Row[], time: string, action?: string): string => `
  <div class="chat-row">
    <div class="bubble">
      <p class="b-title">${esc(title)}</p>
      <ul class="b-rows">${rowsHtml(rows)}</ul>
      ${action ? `<a class="b-btn" href="./login.html">${esc(action)}</a>` : ""}
    </div>
    <time>${esc(time)}</time>
  </div>`;

/** 첫 화면 알림 예시: 기업 대시보드와 같은 가상 데이터로 만든다 */
const renderInbox = (): void => {
  const box = document.getElementById("inbox-msgs");
  const c = findContract(ALERT_CONTRACT);
  const renew = findContract(RENEW_CONTRACT);
  const po = RECONCILE.find((x) => x.contract === ALERT_CONTRACT);
  if (!box || !c || !renew || !po) return;
  const r = adjust(c);
  const rise = Math.round(r.rate * 100);
  box.innerHTML = `
    <p class="sender">Faccon 알림</p>
    ${bubble("[단가 변경] 11월 발주서 확인 필요", [
      ["품목", c.item],
      ["알루미늄 지수", `+${rise}%`],
      ["새 단가", `${won(c.p0)} → ${won(r.price)}`, "new"],
      ["11월 발주서", `${won(po.poPrice)} (수정 필요)`, "warn"],
    ], "오전 8:30", "대시보드에서 확인")}
    ${bubble("[계약 갱신] 계약 끝난 뒤 발주 2건", [
      ["품목", renew.item],
      ["계약 종료", "10월 31일"],
    ], "11월 3일")}`;
};

renderInbox();
