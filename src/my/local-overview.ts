import { won } from "../calc";
import { calculateLocal, requiresAction, taskLabel, visibleDocuments } from "../local-workflow";
import { badge, detailLink, empty, heading, tradeRow } from "./local-shell";
import type { LocalDocument, LocalSession, LocalTrade } from "../types";
import { esc } from "../ui";

export const overview = (trades: readonly LocalTrade[], session: LocalSession): string => {
  const tasks = trades.filter((trade: LocalTrade): boolean => requiresAction(trade, session));
  const month = new Date().toISOString().slice(0, 7);
  const adjusted = trades.filter((trade: LocalTrade): boolean => Boolean(trade.adjustment?.effectiveDate.startsWith(month)));
  const waiting = trades.filter((trade: LocalTrade): boolean => trade.stage === "ready").length;
  return `${heading("업무 요약", `${session.name}님, 오늘 확인할 거래와 단가 조정을 한눈에 확인합니다.`, session.role === "buyer" ? '<a class="fd-button primary" href="./start.html">＋ 새로운 거래 등록</a>' : "")}
  <div class="fd-metrics"><a href="#/trades"><span>등록된 거래</span><strong>${trades.length}<small>건</small></strong></a><a href="#/trades"><span>확인할 업무</span><strong>${tasks.length}<small>건</small></strong></a><a href="#/trades"><span>단가 반영 대기</span><strong>${waiting}<small>건</small></strong></a></div>
  <div class="fd-summary-grid"><section class="fd-panel"><div class="fd-panel-head"><h2>처리할 업무 <em>${tasks.length}</em></h2><a href="#/trades">전체 보기 →</a></div>
  ${tasks.length ? `<div class="fd-task-list">${tasks.slice(0, 3).map((trade: LocalTrade): string => `<a class="fd-task" href="${detailLink(trade.id)}"><div>${badge(trade)}<strong>${esc(trade.title)}</strong><span>${esc(taskLabel(trade, session))}</span></div><span class="fd-arrow">→</span></a>`).join("")}</div>${tasks.length > 3 ? `<a class="fd-list-more" href="#/trades">외 ${tasks.length - 3}건 확인하기</a>` : ""}` : `<div class="fd-mini-empty">${trades.length ? "지금 처리할 업무가 없습니다." : "거래를 등록하면 필요한 업무가 표시됩니다."}</div>`}</section>
  <section class="fd-panel"><div class="fd-panel-head"><h2>${new Date().getMonth() + 1}월 단가 조정</h2><span class="fd-muted">${adjusted.length}건</span></div>
  ${adjusted.length ? adjusted.slice(0, 3).map((trade: LocalTrade): string => `<a class="fd-adjust-row" href="${detailLink(trade.id)}"><div><strong>${esc(trade.title)}</strong><span>${esc(trade.adjustment?.effectiveDate ?? "")} 반영</span></div><div><small>${esc(won(trade.terms.p0))} →</small><strong>${esc(won(calculateLocal(trade, trade.adjustment?.indexValue ?? trade.terms.i0).price))}</strong></div></a>`).join("") : '<div class="fd-mini-empty"><span class="fd-calendar-icon">▦</span>이번 달 반영 예정인 조정이 없습니다.<small>약정 조건에 따라 조정단가를 계산하면 여기에 표시됩니다.</small></div>'}
  </section></div>`;
};
export const tradesView = (trades: readonly LocalTrade[], session: LocalSession): string => `${heading("현재 약정", "거래별 약정 조건과 진행 상태를 확인합니다.", session.role === "buyer" ? '<a class="fd-button primary" href="./start.html">＋ 새로운 거래 등록</a>' : "")}
  ${trades.length ? `<div class="fd-panel fd-trade-list">${trades.map((trade: LocalTrade): string => tradeRow(trade, session)).join("")}</div>` : empty("등록된 거래가 없습니다", session.role === "buyer" ? "신규 거래 또는 기존 연동약정을 등록해 업무를 시작합니다." : "위탁기업이 입력한 수탁기업명과 로그인 회사명이 같은지 확인해 주세요.", session.role === "buyer" ? '<a class="fd-button primary" href="./start.html">첫 거래 등록하기</a>' : "")}`;
export const documentsView = (trades: readonly LocalTrade[], session: LocalSession): string => `${heading("자료·증빙", "거래별 공유 자료와 업무 확인 내역을 모아 내려받습니다.")}
  ${trades.length ? `<div class="fd-panel">${trades.map((trade: LocalTrade): string => {
    const docs: readonly LocalDocument[] = visibleDocuments(trade, session);
    return `<div class="fd-document-summary"><div><strong>${esc(trade.title)}</strong><p>${esc(trade[session.role === "buyer" ? "supplier" : "buyer"])} · 열람 가능한 자료 ${docs.length}개</p>${badge(trade)}</div><div class="fd-actions"><a class="fd-button" href="${detailLink(trade.id)}">자료 확인</a><button class="fd-button" data-export="${esc(trade.id)}">증빙 목록 내려받기</button></div></div>`;
  }).join("")}</div><p class="fd-hint">증빙 목록에는 약정 조건, 계산 근거, 공유 원문 목록, 승인·반영 이력이 담깁니다. 원문은 각 거래에서 개별 내려받습니다.</p>` : empty("아직 보관된 증빙이 없습니다", "등록한 거래의 자료와 승인 이력이 이곳에 연결됩니다.")}`;
