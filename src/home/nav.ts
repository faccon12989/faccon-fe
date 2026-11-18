/* 소개·FAQ 공통 머리 메뉴: 메뉴 이동 · 휴대폰 메뉴 열고 닫기 */
import "./home.css";
import "./home-feel.css";

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
