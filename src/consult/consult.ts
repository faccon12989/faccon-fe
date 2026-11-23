/* 상담 신청 초안은 명시적인 동의 후 이 브라우저에만 저장합니다. */
import "../site/site.css";
import "./consult.css";
import { mountSiteChrome } from "../shared/site-chrome";
import { esc } from "../ui";
import { parseConsult, problemOf, type ConsultDraft } from "./model";

const STORAGE_KEY = "faccon.consult-draft.v1";
const DOWNLOAD_REVOKE_MS = 1000;
const form = document.querySelector<HTMLFormElement>("#consult-form");
const entry = document.getElementById("consult-entry");
const result = document.getElementById("consult-result");
const error = document.getElementById("consult-err");
const restore = document.getElementById("consult-restore");
let saved: ConsultDraft | null = null;

const showError = (message: string): void => {
  if (error) error.textContent = message;
};

const readForm = (target: HTMLFormElement): ConsultDraft => {
  const data = new FormData(target);
  const text = (key: string): string => String(data.get(key) ?? "").trim();
  return { company: text("company"), name: text("name"), contact: text("contact"), item: text("item"), message: text("message"), agreedAt: new Date().toISOString() };
};

const displayResult = (draft: Readonly<ConsultDraft>): void => {
  if (!result || !entry) return;
  entry.hidden = true;
  result.hidden = false;
  result.innerHTML = `<div class="result-icon" aria-hidden="true">✓</div><h2 tabindex="-1" id="result-heading">상담 내용을 저장했습니다</h2><p class="result-lead">${esc(draft.company)}의 상담 내용을 이 브라우저에 저장했습니다. 담당자에게 전송되지는 않았습니다. 파일을 내려받아 상담 시 활용할 수 있습니다.</p><dl class="consult-summary"><dt>기업명</dt><dd>${esc(draft.company)}</dd><dt>담당자명</dt><dd>${esc(draft.name)}</dd><dt>연락처</dt><dd>${esc(draft.contact)}</dd><dt>주요 품목</dt><dd>${esc(draft.item || "미입력")}</dd><dt>상담 내용</dt><dd>${esc(draft.message || "미입력")}</dd></dl><div class="consult-result-actions"><button class="btn solid" type="button" data-action="download">상담 내용 내려받기</button><button class="btn ghost" type="button" data-action="edit">내용 수정</button><a class="btn ghost" href="./">소개로 돌아가기</a></div><button class="delete-draft" type="button" data-action="delete">이 기기의 상담 내용 삭제</button>`;
  document.getElementById("result-heading")?.focus();
};

const download = (draft: Readonly<ConsultDraft>): void => {
  const content = `Faccon 도입 상담 초안\n작성일: ${draft.agreedAt}\n기업명: ${draft.company}\n담당자명: ${draft.name}\n연락처: ${draft.contact}\n주요 품목: ${draft.item || "미입력"}\n\n상담 내용\n${draft.message || "미입력"}\n\n이 파일은 사용자가 작성한 상담 초안입니다. 서버 접수·이메일 전송은 이루어지지 않았습니다.`;
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "Faccon_도입상담_초안.txt";
  link.click();
  window.setTimeout((): void => URL.revokeObjectURL(url), DOWNLOAD_REVOKE_MS);
};

const showEntry = (): void => {
  if (entry) entry.hidden = false;
  if (result) result.hidden = true;
  form?.querySelector<HTMLInputElement>("[name='company']")?.focus();
};

form?.addEventListener("submit", (event: SubmitEvent): void => {
  event.preventDefault();
  const draft = readForm(form);
  const approved = new FormData(form).get("agree") === "on";
  const problem = problemOf(draft, approved);
  showError(problem ?? "");
  if (problem) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, draft }));
    saved = draft;
    displayResult(draft);
  } catch {
    showError("이 브라우저에서 저장할 수 없습니다. 저장 공간 또는 브라우저 설정을 확인한 뒤 다시 시도해 주십시오.");
  }
});

result?.addEventListener("click", (event: MouseEvent): void => {
  const action = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-action]")?.dataset.action : undefined;
  if (action === "download" && saved) download(saved);
  if (action === "edit") showEntry();
  if (action !== "delete") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    saved = null;
    form?.reset();
    showEntry();
    if (restore) restore.textContent = "이 기기에 저장된 상담 내용을 삭제했습니다.";
  } catch {
    const notice = result.querySelector<HTMLElement>(".result-lead");
    if (notice) notice.textContent = "저장된 내용을 삭제하지 못했습니다. 브라우저 저장소 설정을 확인해 주십시오.";
  }
});

const restoreDraft = (): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || !form) return;
    saved = parseConsult(JSON.parse(raw) as unknown);
    if (!saved) return;
    const fill = (key: "company" | "name" | "contact" | "item" | "message"): void => {
      const input = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name='${key}']`);
      if (input && saved) input.value = saved[key];
    };
    fill("company"); fill("name"); fill("contact"); fill("item"); fill("message");
    if (restore) restore.textContent = "이 브라우저에 저장된 상담 초안을 불러왔습니다.";
  } catch {
    if (restore) restore.textContent = "저장된 상담 초안을 불러오지 못했습니다. 새로 작성할 수 있습니다.";
  }
};
restoreDraft();

mountSiteChrome();
