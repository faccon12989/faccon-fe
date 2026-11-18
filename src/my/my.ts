import "./local.css";
import { reviewVisit, previewChange } from "./visit-review";
import { pct, won } from "../calc";
import { clearSession, readLocalStore, readSession, requireSession, saveLocalTrade } from "../local-store";
import { addLocalDocument, calculateLocal, canAccess, runLocalCommand, visibleDocuments } from "../local-workflow";
import { downloadBlob, downloadLocalFile, storeLocalFile, validateLocalFile } from "../local-files";
import { exportPriceCsv, exportTradeText } from "../local-export";
import type { LocalCommand, LocalDocument, LocalSession, LocalTrade } from "../types";
import { esc } from "../ui";
import { detailView } from "./local-detail";
import { documentsView, overview, tradesView } from "./local-overview";
import { detailLink, empty, shell } from "./local-shell";

const session = requireSession();
let toastTimer: number | undefined;
const sessionMatches = (): boolean => {
  const current = readSession();
  return Boolean(session && current && current.role === session.role && current.company === session.company && current.name === session.name);
};
const currentId = (): string => decodeURIComponent(location.hash.split("/")[2] ?? "");
const scopedTrades = (user: LocalSession): readonly LocalTrade[] => readLocalStore().trades.filter((trade: LocalTrade): boolean => canAccess(trade, user));
const findTrade = (id: string): LocalTrade => {
  if (!sessionMatches()) throw new Error("로그인 상태가 바뀌었습니다. 다시 로그인해 주세요.");
  const trade = session ? scopedTrades(session).find((row: LocalTrade): boolean => row.id === id) : undefined;
  if (!trade) throw new Error("현재 회사에서 확인할 수 없는 거래입니다.");
  return trade;
};
const render = (): void => {
  if (!session) return;
  const trades = scopedTrades(session);
  const page = location.hash.split("/")[1] ?? "home";
  let content: string;
  if (page === "trade") {
    const trade = trades.find((row: LocalTrade): boolean => row.id === currentId());
    content = trade ? detailView(trade, session, trades) : empty("거래를 찾을 수 없습니다", "현재 회사의 거래 목록에서 다시 선택해 주세요.", '<a class="fd-button" href="#/trades">현재 약정으로</a>');
  } else content = page === "trades" ? tradesView(trades, session) : page === "documents" ? documentsView(trades, session) : overview(trades, session);
  document.body.innerHTML = shell(session, page, content);
};
const toast = (message: string, error: boolean = false): void => {
  const node = document.getElementById("toast");
  if (!node) return;
  node.textContent = message; node.className = `fd-toast show ${error ? "error" : ""}`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout((): void => node.classList.remove("show"), error ? 6500 : 4000);
};
const execute = (command: LocalCommand): void => {
  if (!session) return;
  saveLocalTrade(runLocalCommand(findTrade(currentId()), session, command));
  render();
};
const handleClick = async (event: MouseEvent): Promise<void> => {
  if (!(event.target instanceof Element) || !session) return;
  const button = event.target.closest<HTMLElement>("button");
  if (!button) return;
  try {
    if (button.hasAttribute("data-logout")) { clearSession(); location.href = "./login.html"; return; }
    if (button.hasAttribute("data-approve-agreement")) {
      if (!document.querySelector<HTMLInputElement>("#agreement-consent")?.checked) throw new Error("약정 조건 확인란에 체크해 주세요.");
      execute({ action: "approveAgreement" }); toast("약정 조건 확인을 완료했습니다. 양사 확인 상태를 업데이트했습니다.");
    }
    if (button.hasAttribute("data-approve-adjustment")) {
      if (!document.querySelector<HTMLInputElement>("#adjustment-consent")?.checked) throw new Error("조정 내용 확인란에 체크해 주세요.");
      execute({ action: "approveAdjustment" }); toast("계산 결과 확인을 완료했습니다.");
    }
    if (button.dataset.file) {
      const doc = visibleDocuments(findTrade(currentId()), session).find((row: LocalDocument): boolean => row.id === button.dataset.file);
      if (!doc) throw new Error("이 자료를 확인할 수 없습니다.");
      await downloadLocalFile(doc);
    }
    if (button.dataset.export) {
      const trade = findTrade(button.dataset.export);
      downloadBlob(new Blob([exportTradeText(trade, session)], { type: "text/plain;charset=utf-8" }), `FACCON_${trade.id}_증빙목록.txt`);
      toast("약정·조정·승인 이력이 담긴 증빙 목록을 내려받았습니다.");
    }
    if (button.hasAttribute("data-export-price")) {
      const trade = findTrade(currentId());
      downloadBlob(new Blob([exportPriceCsv(trade)], { type: "text/csv;charset=utf-8" }), `FACCON_${trade.id}_단가반영.csv`);
      toast("ERP에 반영할 단가와 적용 기준을 CSV로 내려받았습니다.");
    }
  } catch (error: unknown) { toast(error instanceof Error ? error.message : "작업을 완료하지 못했습니다.", true); }
};
const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.dataset.form || !session) return;
  event.preventDefault();
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submit) submit.disabled = true;
  const data = new FormData(form);
  const value = (name: string): string => String(data.get(name) ?? "").trim();
  try {
    if (form.dataset.form === "visitReview") {
      const out = document.getElementById("visit-review-output");
      if (out) { out.replaceChildren(); await reviewVisit(findTrade(currentId()), session, data, out); }
    } else if (form.dataset.form === "visitChange") {
      previewChange(findTrade(currentId()), value("adjusted"));
    } else if (form.dataset.form === "upload") {
      const file = data.get("file");
      if (!(file instanceof File)) throw new Error("등록할 파일을 선택해 주세요.");
      validateLocalFile(file);
      const doc: LocalDocument = { id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, kind: value("kind"), scope: value("scope") === "shared" ? "shared" : "private", owner: session.company, uploadedAt: new Date().toISOString() };
      const tradeId = currentId();
      addLocalDocument(findTrade(tradeId), doc, session);
      await storeLocalFile(doc.id, file);
      saveLocalTrade(addLocalDocument(findTrade(tradeId), doc, session)); render(); toast("자료를 등록했습니다. 선택한 공유 범위를 적용했습니다.");
    } else {
      const action = form.dataset.form as LocalCommand["action"];
      execute({ action, note: value("note"), indexValue: Number(value("indexValue")), effectiveDate: value("effectiveDate"), source: value("source"), poPrice: Number(value("poPrice")), invoicePrice: Number(value("invoicePrice")), reference: value("reference"), deliveryDate: value("deliveryDate"), inspectionDate: value("inspectionDate") });
      const messages: Readonly<Record<string, string>> = { request: "자료 요청을 등록했습니다. 수탁기업의 거래 화면에서 확인할 수 있습니다.", return: "보완 요청을 등록했습니다. 수탁기업이 필요한 내용을 확인할 수 있습니다.", submit: "자료 제출을 완료했습니다. 위탁기업이 검토할 수 있습니다.", proposeAdjustment: "약정 산식으로 계산했습니다. 결과와 반영일을 확인하고 ERP에 반영해 주세요.", submitInvoice: "청구정보를 제출했습니다. 위탁기업이 발주 단가와 대조할 수 있습니다.", reflect: "발주·청구 단가가 일치합니다. 반영 확인을 완료했습니다." };
      toast(messages[action] ?? "업무 내용을 저장했습니다.");
    }
  } catch (error: unknown) { toast(error instanceof Error ? error.message : "저장하지 못했습니다.", true); }
  finally { if (submit) submit.disabled = false; }
};
document.addEventListener("click", (event: MouseEvent): void => { void handleClick(event); });
document.addEventListener("submit", (event: SubmitEvent): void => { void handleSubmit(event); });
document.addEventListener("change", (event: Event): void => {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.id === "trade-navigation") location.hash = detailLink(target.value);
});
document.addEventListener("input", (event: Event): void => {
  const target = event.target;
  if (target instanceof Element && target.closest('[data-form="visitReview"]')) document.getElementById("visit-review-output")?.replaceChildren();
  if (!(target instanceof HTMLInputElement) || target.name !== "indexValue") return;
  const preview = document.getElementById("calc-preview");
  if (!preview) return;
  try {
    const result = calculateLocal(findTrade(currentId()), Number(target.value));
    preview.innerHTML = `<strong>${esc(won(result.price))}</strong><span>지표 변동 ${esc(pct(result.rate))} · ${result.triggered ? "조정요건 충족" : "조정요건 미충족"}</span>`;
  } catch { preview.textContent = "0보다 큰 비교지표 값을 입력해 주세요."; }
});
window.addEventListener("hashchange", (): void => { render(); window.scrollTo(0, 0); });
window.addEventListener("storage", (): void => render());
window.addEventListener("pageshow", (): void => {
  if (session && !sessionMatches()) location.replace("./login.html");
});
try { render(); } catch (error: unknown) {
  document.body.innerHTML = `<main class="fd-load-error"><h1>업무 데이터를 열지 못했습니다</h1><p>${esc(error instanceof Error ? error.message : "브라우저 저장공간을 확인해 주세요.")}</p><a href="./login.html">로그인 화면으로</a></main>`;
}
