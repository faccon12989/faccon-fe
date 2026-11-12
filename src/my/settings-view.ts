/* 기업 대시보드: 설정 (알림 받을 곳 · 알림 받을 일 · 받는 사람) */
import { esc } from "../ui";
import { CHANNELS, type MyState } from "./screens";

export const ALERT_EVENTS: readonly Readonly<{ id: string; label: string; hint: string }>[] = [
  { id: "renew", label: "계약 갱신 기한", hint: "계약 종료 30일 전, 종료 후 발주가 생겼을 때" },
  { id: "adjust", label: "조정 시점", hint: "약정한 확인일에 지표가 요건을 넘었을 때" },
  { id: "spike", label: "지표 급변", hint: "확인일 전이라도 지표가 크게 움직였을 때" },
  { id: "reply", label: "공급사 자료 회신", hint: "요청한 자료가 올라오거나 기한이 지났을 때" },
];

const RECIPIENTS: readonly Readonly<{ name: string; role: string; gets: string }>[] = [
  { name: "김구매", role: "구매 담당자", gets: "모든 알림" },
  { name: "이OO", role: "구매팀장 (결재권자)", gets: "승인 요청만" },
];

export const settingsScreen = (s: MyState): string => {
  const channels = CHANNELS.map((ch) =>
    `<label class="chan"><input type="checkbox" data-channel="${ch.id}" ${s.channels.includes(ch.id) ? "checked" : ""}> ${ch.label}</label>`).join("");
  const events = ALERT_EVENTS.map((ev) => `<tr>
      <td><label class="chan"><input type="checkbox" data-event="${ev.id}" ${s.events.includes(ev.id) ? "checked" : ""}> ${esc(ev.label)}</label></td>
      <td class="muted-cell">${esc(ev.hint)}</td></tr>`).join("");
  const people = RECIPIENTS.map((r) => `<tr><td><b>${esc(r.name)}</b></td><td>${esc(r.role)}</td><td>${esc(r.gets)}</td></tr>`).join("");
  return `
    <header class="page-h"><div><h1>설정</h1><p>알림과 받는 사람</p></div></header>
    <section class="panel"><h2>알림 받을 곳</h2><div class="chans">${channels}</div></section>
    <section class="panel"><h2>알림 받을 일</h2>
      <table class="grid"><tbody>${events}</tbody></table></section>
    <section class="panel"><div class="panel-h"><h2>받는 사람</h2>
      <span class="foot-note">가상 담당자 예시 · 추가 기능 준비 중</span></div>
      <table class="grid"><thead><tr><th>이름</th><th>역할</th><th>받는 알림</th></tr></thead><tbody>${people}</tbody></table></section>`;
};
