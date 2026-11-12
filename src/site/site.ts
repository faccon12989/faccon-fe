/* 서비스 소개 페이지: 첫 화면 알림 대화방 (알림이 하나씩 도착하는 애니메이션) */
import "./site.css";
import { adjust, won } from "../calc";
import { RECONCILE } from "../data";
import { esc, findContract } from "../ui";

const ALERT_CONTRACT = "AL-001";
const RENEW_CONTRACT = "ST-005";
/** 알림이 하나씩 도착하는 간격 */
const ARRIVE_GAP_MS = 900;

type Row = readonly [label: string, value: string, tone?: "new" | "warn"];

const rowsHtml = (rows: readonly Row[]): string => rows
  .map(([label, value, tone]) => `<li><span>${esc(label)}</span><b class="${tone ?? ""}">${esc(value)}</b></li>`)
  .join("");

const dateLine = (text: string): string => `<p class="chat-date">${esc(text)}</p>`;

const message = (title: string, rows: readonly Row[], time: string, action?: string): string => `
  <div class="chat-msg">
    <span class="avatar" aria-hidden="true">F</span>
    <div class="chat-col">
      <p class="chat-name">Faccon</p>
      <div class="chat-line">
        <div class="talk">
          <p class="talk-head">알림톡 도착</p>
          <div class="talk-body">
            <p class="talk-title">${esc(title)}</p>
            <ul class="talk-rows">${rowsHtml(rows)}</ul>
            ${action ? `<a class="talk-btn" href="./login.html">${esc(action)}</a>` : ""}
          </div>
        </div>
        <time>${esc(time)}</time>
      </div>
    </div>
  </div>`;

/** 대화방 안의 항목(날짜·메시지)을 차례로 나타나게 한다 */
const playArrival = (box: HTMLElement): void => {
  const items = [...box.children];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  items.forEach((el, i) => {
    if (reduce) { el.classList.add("in"); return; }
    window.setTimeout(() => el.classList.add("in"), 300 + i * ARRIVE_GAP_MS);
  });
};

/** 첫 화면 알림 예시: 기업 대시보드와 같은 가상 데이터로 만든다 */
const renderChat = (): void => {
  const box = document.getElementById("inbox-msgs");
  const c = findContract(ALERT_CONTRACT);
  const renew = findContract(RENEW_CONTRACT);
  const po = RECONCILE.find((x) => x.contract === ALERT_CONTRACT);
  if (!box || !c || !renew || !po) return;
  const r = adjust(c);
  const rise = Math.round(r.rate * 100);
  box.innerHTML = [
    dateLine("2026년 11월 1일 일요일"),
    message("[단가 변경] 11월 발주서 확인 필요", [
      ["품목", c.item],
      ["지수 변동", `알루미늄 +${rise}%`],
      ["새 단가", `${won(c.p0)} → ${won(r.price)}`, "new"],
      ["11월 발주서", `${won(po.poPrice)} (수정 필요)`, "warn"],
    ], "오전 8:30", "대시보드에서 확인"),
    dateLine("2026년 11월 3일 화요일"),
    message("[계약 갱신] 계약 끝난 뒤 발주 2건", [
      ["품목", renew.item],
      ["계약 종료", "10월 31일"],
    ], "오전 9:00"),
  ].join("");
  playArrival(box);
};

/** 대시보드 미리보기: 왼쪽 메뉴를 빼고 '요약 + 처리할 업무' 부분만 잘라 칸 폭에 맞춘다 */
const CROP_X = 250;
const CROP_W = 1170;
const fitPreview = (): void => {
  const frame = document.querySelector<HTMLElement>(".shot-frame");
  const iframe = frame?.querySelector<HTMLIFrameElement>("iframe");
  if (!frame || !iframe) return;
  const resize = (): void => {
    const scale = frame.clientWidth / CROP_W;
    iframe.style.transform = `translateX(${-CROP_X * scale}px) scale(${scale})`;
  };
  resize();
  new ResizeObserver(resize).observe(frame);
};

renderChat();
fitPreview();
