/* 소개 페이지: 공통 머리 메뉴 + 상담 신청(데모, 전송 없음) */
import "./nav";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9-]{9,14}$/;

interface ContactInput {
  readonly company: string;
  readonly person: string;
  readonly email: string;
  readonly phone: string;
}

const readForm = (form: HTMLFormElement): ContactInput => {
  const data = new FormData(form);
  const text = (key: string): string => String(data.get(key) ?? "").trim();
  return { company: text("company"), person: text("person"), email: text("email"), phone: text("phone") };
};

const checkForm = (v: ContactInput): string | null => {
  if (!v.company || !v.person) return "기업명과 담당자명을 입력해 주십시오.";
  if (!EMAIL_RE.test(v.email)) return "이메일 주소를 확인해 주십시오.";
  if (!PHONE_RE.test(v.phone.replace(/\s/g, ""))) return "연락처를 숫자와 '-'로 입력해 주십시오.";
  return null;
};

const form = document.querySelector<HTMLFormElement>("#home-contact");
const status = document.querySelector<HTMLElement>("#home-contact-status");

form?.addEventListener("submit", (e: SubmitEvent): void => {
  e.preventDefault();
  if (!status) return;
  const error = checkForm(readForm(form));
  status.classList.toggle("err", error !== null);
  status.textContent = error ?? "데모라서 실제로 전송되지는 않았습니다. 실제 상담은 운영 연락처가 정해진 뒤 받습니다.";
  if (!error) form.reset();
});
