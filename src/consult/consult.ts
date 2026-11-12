/* 파일럿 상담 신청 (데모): 형식만 확인하고 완료 안내를 보여준다. 아무것도 전송하지 않는다. */
import "../site/site.css";
import "../login/login.css";
import "./consult.css";
import { esc } from "../ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

interface Consult {
  company: string;
  name: string;
  contact: string;
  agree: boolean;
}

/** 신청할 수 없는 이유. 없으면 null. */
const problemOf = (c: Consult): string | null => {
  if (!c.company) return "회사명을 적어 주세요.";
  if (!c.name) return "담당자 이름을 적어 주세요.";
  if (!PHONE_RE.test(c.contact) && !EMAIL_RE.test(c.contact)) return "연락처는 휴대폰 번호(010-1234-5678) 또는 이메일로 적어 주세요.";
  if (!c.agree) return "연락 정보 수집에 동의해 주세요.";
  return null;
};

const form = document.getElementById("consult-form");
const err = document.getElementById("consult-err");
const card = document.getElementById("consult-card");

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!(form instanceof HTMLFormElement) || !card) return;
  const data = new FormData(form);
  const text = (key: string): string => String(data.get(key) ?? "").trim();
  const consult: Consult = { company: text("company"), name: text("name"), contact: text("contact"), agree: data.get("agree") === "on" };
  const problem = problemOf(consult);
  if (err) err.textContent = problem ?? "";
  if (problem) return;
  card.innerHTML = `
    <h1>신청이 접수됐습니다</h1>
    <p class="consult-lead">${esc(consult.company)} ${esc(consult.name)}님, 영업일 기준 이틀 안에 ${esc(consult.contact)}(으)로 연락드리겠습니다.</p>
    <p class="consult-lead">상담 때 서명된 연동약정서와 최근 발주 내역을 보여 주시면 바로 확인해 드릴 수 있어요.</p>
    <div class="row"><a class="btn solid" href="./">소개로 돌아가기</a><a class="btn ghost" href="./login.html">데모 대시보드 보기</a></div>
    <p class="demo-note">데모 화면이라 실제로 접수되지는 않았습니다.</p>`;
});
