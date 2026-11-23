import { esc } from "../ui";
import { STAGE_LABEL, taskLabel } from "../local-workflow";
import type { LocalSession, LocalTrade } from "../types";

export const detailLink = (id: string): string => `#/trade/${encodeURIComponent(id)}`;
export const badge = (trade: LocalTrade): string => `<span class="fd-badge ${["active", "completed"].includes(trade.stage) ? "success" : ""}">${esc(STAGE_LABEL[trade.stage])}</span>`;
export const dateText = (iso: string): string => new Date(iso).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
export const shell = (session: LocalSession, page: string, content: string): string => `<div class="fd-app">
  <aside class="fd-sidebar">
    <div class="fd-org"><span class="fd-avatar">${esc(session.company.slice(0, 1))}</span><div><strong>${esc(session.company)}</strong><small>${session.role === "buyer" ? "위탁기업" : "수탁기업"} 워크스페이스</small></div></div>
    <nav aria-label="업무 메뉴"><a class="${page === "home" ? "on" : ""}" href="#/home"><span>◫</span>업무 요약</a><a class="${page === "trades" || page === "trade" ? "on" : ""}" href="#/trades"><span>▤</span>현재 약정</a><a class="${page === "documents" ? "on" : ""}" href="#/documents"><span>▧</span>자료·증빙</a></nav>
    ${session.role === "buyer" ? '<a class="fd-create" href="./start.html">＋ 새로운 거래 등록</a>' : '<div class="fd-side-note">등록된 거래의 자료 제출과<br>약정 승인·계산 확인을 진행합니다.</div>'}
    <div class="fd-account"><strong>${esc(session.name)}</strong><small>${esc(session.company)}</small><button class="fd-text-button" data-logout>로그아웃</button></div>
  </aside><main class="fd-main" id="workspace" tabindex="-1">${content}</main></div><div class="fd-toast" id="toast" role="status" aria-live="polite"></div>`;
export const heading = (title: string, desc: string, action: string = ""): string => `<header class="fd-page-head"><div><p class="fd-eyebrow">FACCON WORKSPACE</p><h1>${esc(title)}</h1><p>${esc(desc)}</p></div>${action}</header>`;
export const empty = (title: string, desc: string, action: string = ""): string => `<div class="fd-empty"><span class="fd-empty-icon">▤</span><h2>${esc(title)}</h2><p>${esc(desc)}</p>${action}</div>`;
export const tradeRow = (trade: LocalTrade, session: LocalSession): string => `<a class="fd-trade-row" href="${detailLink(trade.id)}"><div class="fd-row-primary"><strong>${esc(trade.title)}</strong><span>${esc(trade[session.role === "buyer" ? "supplier" : "buyer"])} · ${esc(trade.material)}</span></div><div class="fd-row-note">${esc(taskLabel(trade, session))}</div>${badge(trade)}<span class="fd-arrow">→</span></a>`;
export const input = (label: string, name: string, type: string = "text", value: string = "", extra: string = ""): string => `<label class="fd-field"><span>${esc(label)}</span><input name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${extra}></label>`;
export const notice = (text: string): string => `<p class="fd-notice">${esc(text)}</p>`;
