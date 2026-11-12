/* 사용자 화면: 홈 · 내 약정 · 약정 상세 · 자료 */
import { adjust, pct, signedWon, won } from "../calc";
import { CONTRACTS, isCounted, NOTICES, PURPOSES, REQUESTS, TODOS, TRAILS } from "../data";
import type { Channel, Contract, Todo } from "../types";
import { esc, findContract, supplierName } from "../ui";

export interface MyState {
  readonly tab: "home" | "contracts" | "docs";
  readonly detail: string | null;
  readonly doneTasks: readonly string[];
  /** 화면을 열지 않아도 알림을 받을 곳 */
  readonly channels: readonly Channel[];
}

export const CHANNELS: readonly Readonly<{ id: Channel; label: string }>[] = [
  { id: "kakao", label: "카카오톡" },
  { id: "email", label: "이메일" },
  { id: "sms", label: "문자" },
];

const ICON: Readonly<Record<Todo["kind"], string>> = { unapplied: "₩", renew: "↻", missing: "?" };
const TONE: Readonly<Record<Todo["kind"], string>> = { unapplied: "red", renew: "amber", missing: "blue" };

const todoCard = (t: Todo): string => {
  const c = findContract(t.contract);
  return `<button class="task ${TONE[t.kind]}" data-task="${esc(t.code)}">
    <span class="task-ic" aria-hidden="true">${ICON[t.kind]}</span>
    <span class="task-t"><b>${esc(t.title)}</b><small>${esc(c?.item)} · ${esc(t.reason)}</small>
      <span class="sent">${esc(t.notified)} 발송</span></span>
    <span class="task-go" aria-hidden="true">›</span>
  </button>`;
};

/** 알림 받을 곳: 누르면 켜고 끈다 */
const alertBar = (s: MyState): string => {
  const chips = CHANNELS.map((ch) => {
    const on = s.channels.includes(ch.id);
    return `<button class="chan ${on ? "on" : ""}" data-channel="${ch.id}" aria-pressed="${on}">${ch.label}</button>`;
  }).join("");
  return `<section class="alerts" aria-label="알림 받을 곳">
    <p><b>화면을 안 열어도 알려드려요</b><small>갱신 기한, 조정 시점, 지표 급변을 아래로 보내요</small></p>
    <div class="chans">${chips}</div>
  </section>`;
};

/** 이번 달 차액 합계와, 무엇을 합쳤는지 */
const monthBlock = (): string => {
  const counted = CONTRACTS.filter(isCounted).map((c) => ({ c, r: adjust(c) }));
  const up = counted.filter((x) => x.r.total > 0).reduce((a, x) => a + x.r.total, 0);
  const down = counted.filter((x) => x.r.total < 0).reduce((a, x) => a + x.r.total, 0);
  const excluded = CONTRACTS.filter((c) => !isCounted(c));
  const rows = counted.map(({ c, r }) => `<tr>
      <td>${esc(c.item)}<small>${esc(supplierName(c.supplier))}</small></td>
      <td class="n">${r.triggered ? `${signedWon(r.diffPerUnit)} × ${c.qty.toLocaleString()}개` : "요건 미달"}</td>
      <td class="n ${r.total > 0 ? "up" : r.total < 0 ? "down" : ""}">${r.triggered ? signedWon(r.total) : "0원"}</td></tr>`).join("");
  return `<section class="month">
      <h2>이번 달 조정 차액 <span class="basis">합계</span></h2>
      <div class="month-row">
        <div><small>올라간 금액 합계</small><b class="up">${signedWon(up)}</b></div>
        <div><small>내려간 금액 합계</small><b class="down">${won(down)}</b></div>
      </div>
      <p class="tiny">약정 ${counted.length}건을 더한 값 · 약정별 (조정단가 − 기준단가) × 적용 수량 · 양사 간 주고받는 금액</p>
      <details class="breakdown"><summary>어떤 약정을 더했나요?</summary>
        <table><tbody>${rows}</tbody></table>
        <p class="tiny">빠진 약정 ${excluded.length}건: ${excluded.map((c) => `${esc(c.item)} (${c.status === "nolink" ? "미연동 합의" : "약정 준비 중"})`).join(", ")}</p>
      </details>
    </section>`;
};

const noticeBlock = (): string => {
  const items = NOTICES.map((n) => `<li>
      <span class="n-date">${esc(n.date)}</span>
      <b>${esc(n.title)}</b><p>${esc(n.body)}</p>
      <small>내 약정 영향 · ${esc(n.impact)}</small></li>`).join("");
  return `<section class="notices"><h2>제도 소식</h2><ul>${items}</ul>
    <p class="tiny">법령 원문과 시행일은 운영팀이 확인한 뒤 올려요. 내 거래에 맞는지는 담당자가 최종 판단해요.</p></section>`;
};

export const homeScreen = (s: MyState): string => {
  const open = TODOS.filter((t) => !s.doneTasks.includes(t.code));
  const tasks = open.length
    ? open.map(todoCard).join("")
    : `<div class="all-done"><span aria-hidden="true">✓</span><b>이번 달 확인할 일을 모두 끝냈어요</b><small>다음 지표 확인일은 12월 1일이에요</small></div>`;
  return `
    <section class="hello">
      <p class="date">2026년 11월</p>
      <h1>${open.length ? `확인할 일이 <em>${open.length}건</em> 있어요` : "모두 정리됐어요"}</h1>
    </section>
    <div class="cols">
      <div class="col-main"><section class="tasks" aria-label="확인할 일">${tasks}</section>${monthBlock()}</div>
      <aside class="col-side">${alertBar(s)}${noticeBlock()}</aside>
    </div>`;
};

const contractTag = (c: Contract): string => {
  if (c.status === "nolink") return `<span class="pill2 gray">미연동 합의</span>`;
  if (c.status === "draft") return `<span class="pill2 gray">준비 중</span>`;
  const r = adjust(c);
  if (!r.triggered) return `<span class="pill2 gray">변동 없음</span>`;
  return r.diffPerUnit > 0 ? `<span class="pill2 red">${pct(r.rate)} 인상</span>` : `<span class="pill2 blue">${pct(r.rate)} 인하</span>`;
};

const contractPrice = (c: Contract): string => {
  if (c.status === "nolink") return "연동하지 않음 · 사유와 합의서 보관";
  if (c.status === "draft") return "약정 준비 중";
  const r = adjust(c);
  return r.triggered ? `${won(c.p0)} → <b>${won(r.price)}</b>` : `<b>${won(c.p0)}</b> 유지`;
};

export const contractsScreen = (): string => {
  const cards = CONTRACTS.map((c) => `<button class="ccard" data-detail="${esc(c.id)}">
      <span class="cc-top"><b>${esc(c.item)}</b>${contractTag(c)}</span>
      <span class="cc-sup">${esc(supplierName(c.supplier))}</span>
      <span class="cc-price">${contractPrice(c)}</span>
    </button>`).join("");
  return `<section class="hello"><h1>내 약정</h1><p class="date">공급기업 ${CONTRACTS.length}곳 · 11월 지표 기준</p></section>
    <div class="clist">${cards}</div>`;
};

/** 올린 사람 → 확인한 사람 → 승인한 사람 */
const trailBlock = (id: string): string => {
  const t = TRAILS.find((x) => x.contract === id);
  if (!t) return "";
  const step = (label: string, who: string | null, note: string): string => `<li class="${who ? "done" : "wait"}">
      <span class="tr-l">${label}</span><b>${esc(who ?? "아직 안 됨")}</b><small>${note}</small></li>`;
  return `<section class="facts trail"><h2>누가 했나요?</h2><ol>
      ${step("올림", t.uploaded, "약정서·자료 등록")}
      ${step("확인", t.checked, "상대 기업이 값이 맞는지 확인")}
      ${step("승인", t.approved, "결재권자가 확정 · AI나 서비스가 대신하지 않아요")}
    </ol></section>`;
};

const noLinkDetail = (c: Contract): string => `
    <div class="price-hero flat"><small>이 거래는</small><b>연동하지 않음</b><span>양사가 서면으로 합의 · ${esc(c.noLink?.agreedOn)}</span></div>
    <section class="explain"><h2>왜 연동하지 않나요?</h2><p>${esc(c.noLink?.reason)}</p>
      <p class="formula-s">보관 문서 · ${esc(c.noLink?.doc)}</p>
      <p class="tiny">미연동 합의도 사유와 서면을 남겨야 해요. 조사·보고 때 이 기록을 같이 묶어 드려요.</p></section>`;

const adjustDetail = (c: Contract): string => {
  const r = adjust(c);
  const explain = !r.triggered
    ? `지표가 ${pct(r.rate)} 움직였어요. 약정 요건(±${c.threshold}%)보다 작아서 이번 달은 단가가 그대로예요.`
    : `지표가 ${c.i0}에서 ${r.it}로 ${pct(r.rate)} ${r.diffPerUnit > 0 ? "올라" : "내려"} 약정 요건(±${c.threshold}%)을 넘었어요. 원재료비 ${won(c.m0)}에 ${pct(Math.abs(r.rate))}를 반영해 ${won(Math.abs(r.diffPerUnit))} ${r.diffPerUnit > 0 ? "올라요" : "내려요"}.`;
  return `
    <div class="price-hero ${!r.triggered ? "flat" : r.diffPerUnit > 0 ? "up" : "down"}">
      <small>이번 달 단가</small><b>${won(r.price)}</b>
      <span>${r.triggered ? `기존 ${won(c.p0)} · ${c.qty.toLocaleString()}개면 ${signedWon(r.total)}` : "변동 없음"}</span>
    </div>
    <section class="explain"><h2>왜 이렇게 됐나요?</h2><p>${explain}</p>
      <p class="formula-s">${c.p0.toLocaleString()} + ${c.m0.toLocaleString()} × (${r.it} − ${c.i0}) ÷ ${c.i0} = ${r.price.toLocaleString()}</p></section>
    <section class="facts"><h2>약정 내용</h2>
      <dl><dt>원재료</dt><dd>${esc(c.material)}</dd><dt>지표</dt><dd>${esc(c.index)}</dd>
      <dt>확인 주기</dt><dd>${esc(c.cycle)}</dd><dt>적용</dt><dd>${esc(c.applyDay)}</dd><dt>계약 종료</dt><dd>${esc(c.end)}</dd></dl>
      <p class="tiny">공급기업의 원가 원문은 보이지 않아요. 양사가 합의한 값만 보여요.</p></section>`;
};

export const detailScreen = (id: string): string => {
  const c = findContract(id);
  if (!c) return `<p>약정을 찾을 수 없어요.</p>`;
  return `
    <button class="back" data-tab="contracts">‹ 내 약정</button>
    <section class="hello"><p class="date">${esc(supplierName(c.supplier))} · ${esc(c.version)}</p><h1>${esc(c.item)}</h1></section>
    <div class="cols"><div class="col-main">${c.status === "nolink" ? noLinkDetail(c) : adjustDetail(c)}</div>
      <aside class="col-side">${trailBlock(c.id)}</aside></div>`;
};

export const docsScreen = (): string => {
  const items = REQUESTS.map((q) => `<li class="doc">
      <span class="doc-ic" aria-hidden="true">${q.reuse ? "↺" : "↗"}</span>
      <span><b>${esc(q.item)}</b><small>${esc(supplierName(q.supplier))} · ${esc(q.reuse ? `기존 자료 재사용 (${q.reuse})` : q.state)}</small></span>
    </li>`).join("");
  const purposes = PURPOSES.map((p) => {
    const ready = p.items.filter((i) => i.ready).length;
    const list = p.items.map((i) => `<li class="${i.ready ? "ok" : "todo"}"><span>${i.ready ? "준비됨" : "필요"}</span>${esc(i.doc)}</li>`).join("");
    return `<details class="purpose-d"><summary><b>${esc(p.name)}</b><span class="cnt">${ready}/${p.items.length}</span></summary>
      <p class="tiny">${esc(p.note)}</p><ul class="need">${list}</ul>
      <button class="btn solid sm" data-toast="${esc(p.name)} 자료 묶음을 만들었어요 (데모)">자료 묶음 만들기</button></details>`;
  }).join("");
  return `<section class="hello"><h1>자료</h1><p class="date">요청한 자료와 제출할 자료</p></section>
    <div class="cols"><div class="col-main"><h2 class="col-h">공급기업과 주고받은 요청</h2><ul class="docs">${items}</ul></div>
    <aside class="col-side"><section class="month"><h2>어디에 낼 자료인가요?</h2>
      <p class="tiny">목적을 고르면 필요한 자료와 지금 준비된 것을 보여드려요. 실제 요구 항목은 공고마다 달라서, 공고 파일을 올리면 그 기준으로 다시 맞춰요.</p>
      ${purposes}
    </section></aside></div>`;
};
