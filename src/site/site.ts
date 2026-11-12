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
            ${action ? `<a class="talk-btn" href="./my.html">${esc(action)}</a>` : ""}
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

/** '왜 필요한가' 숫자: 화면에 들어오면 0%에서 원래 값까지 올라간다 */
const COUNT_MS = 1400;
const easeOut = (t: number): number => 1 - (1 - t) ** 3;

const countUp = (el: HTMLElement): void => {
  const match = /^([\d.]+)(.*)$/.exec(el.textContent?.trim() ?? "");
  if (!match?.[1]) return;
  const target = Number(match[1]);
  const digits = match[1].split(".")[1]?.length ?? 0;
  const suffix = match[2] ?? "";
  const start = performance.now();
  const tick = (now: number): void => {
    const t = Math.min(1, (now - start) / COUNT_MS);
    el.textContent = `${(target * easeOut(t)).toFixed(digits)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const setupCounters = (): void => {
  const nums = [...document.querySelectorAll<HTMLElement>(".why-stats b")];
  if (!nums.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const finals = nums.map((n) => n.textContent ?? "");
  nums.forEach((n, i) => { n.textContent = (finals[i] ?? "").replace(/[\d.]+/, (v) => (0).toFixed(v.split(".")[1]?.length ?? 0)); });
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target as HTMLElement;
      el.textContent = finals[nums.indexOf(el)] ?? "";
      countUp(el);
      seen.unobserve(el);
    });
  }, { threshold: 0.6 });
  nums.forEach((n) => seen.observe(n));
};

/** '알림을 누르면 열리는 화면': 대시보드의 발주 미반영 처리 화면과 같은 내용 */
const renderFixCard = (): void => {
  const box = document.getElementById("fix-card");
  const c = findContract(ALERT_CONTRACT);
  const po = RECONCILE.find((x) => x.contract === ALERT_CONTRACT);
  if (!box || !c || !po) return;
  const r = adjust(c);
  const rise = Math.round(r.rate * 100);
  const gap = (r.price - po.poPrice) * po.qty;
  box.innerHTML = `
    <p class="fc-label">발주 미반영 · ${esc(c.item)}</p>
    <p class="fc-title">발주에 옛 단가가 남아 있어요</p>
    <div class="fc-compare">
      <div><small>약정대로 계산한 단가</small><b>${won(r.price)}</b></div>
      <span aria-hidden="true">≠</span>
      <div><small>11월 발주 ${esc(po.po)}</small><b class="old">${won(po.poPrice)}</b></div>
    </div>
    <p class="fc-why"><b>왜 바뀌었나요?</b> 알루미늄 지수가 ${rise}% 올라 약정 요건(±${c.threshold}%)을 넘었어요. 원재료비 ${won(c.m0)}의 ${rise}%인 ${won(r.price - c.p0)}이 올라갑니다.</p>
    <p class="fc-impact">그대로 두면 ${po.qty.toLocaleString()}개 기준 <b>${won(gap)}</b>이 반영되지 않아요.</p>
    <a class="btn solid" href="./my.html">단가 반영 요청</a>`;
};

renderChat();
renderFixCard();
fitPreview();
setupCounters();
