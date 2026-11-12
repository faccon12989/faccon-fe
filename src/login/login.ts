/* 기업 로그인 (데모): 형식만 확인하고 기업 대시보드(내 업무)로 이동한다. 아무것도 전송하지 않는다. */
import "../site/site.css";
import "./login.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DASHBOARD = "./my.html";

const form = document.getElementById("login-form");
const err = document.getElementById("login-err");

/** 넘어갈 수 없는 이유. 없으면 null. */
const problemOf = (email: string, password: string): string | null => {
  if (!EMAIL_RE.test(email)) return "업무 이메일 형식을 확인해 주세요.";
  if (password.length === 0) return "비밀번호를 입력해 주세요.";
  return null;
};

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!(form instanceof HTMLFormElement)) return;
  const data = new FormData(form);
  const problem = problemOf(String(data.get("email") ?? "").trim(), String(data.get("password") ?? ""));
  if (err) err.textContent = problem ?? "";
  if (problem) return;
  window.location.href = DASHBOARD;
});
