/* 소개 페이지: 메뉴 이동 · 휴대폰 메뉴 · 상담 신청(데모, 전송 없음) */
import "./home.css";
import "./home-feel.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9-]{9,14}$/;

const menu = document.querySelector<HTMLElement>("#home-links");
const menuButton = document.querySelector<HTMLButtonElement>(".menu-toggle");

const setMenu = (open: boolean): void => {
  menu?.classList.toggle("open", open);
  menuButton?.setAttribute("aria-expanded", String(open));
  menuButton?.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
};

/** 같은 페이지 안(#…)이면 부드럽게 이동하고, 아니면 해당 페이지로 간다 */
const go = (target: string): void => {
  setMenu(false);
  if (!target.startsWith("#")) {
    location.href = target;
    return;
  }
  document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", target === "#top" ? location.pathname : target);
};

document.addEventListener("click", (e: MouseEvent): void => {
  const el = e.target instanceof Element ? e.target : null;
  if (!el) return;
  if (el.closest(".menu-toggle")) {
    setMenu(!menu?.classList.contains("open"));
    return;
  }
  const target = el.closest<HTMLElement>("[data-go]")?.dataset.go;
  if (target) go(target);
});

/* ── 상담 신청: 데모라서 확인만 하고 어디로도 보내지 않는다 ── */
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
