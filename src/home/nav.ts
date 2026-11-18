/* 소개·도입 방식·FAQ 공통 머리 메뉴: 펼침 메뉴 · 페이지 이동 · 휴대폰 메뉴 */
import "./home.css";
import "./home-feel.css";
import "./nav.css";
import { esc } from "../ui";

interface NavLink {
  readonly label: string;
  readonly href: string;
  readonly desc?: string;
  readonly page?: string;
}
interface NavGroup {
  readonly label: string;
  readonly page?: string;
  readonly items: readonly NavLink[];
}
type NavEntry = NavLink | NavGroup;

const NAV: readonly NavEntry[] = [
  {
    label: "서비스 소개",
    page: "feature",
    items: [
      { label: "단가 계산", desc: "약정 산식 그대로 계산합니다", href: "./feature.html?f=calc" },
      { label: "반영 대조", desc: "발주서에 빠진 단가를 찾아냅니다", href: "./feature.html?f=recon" },
      { label: "자료 공유", desc: "정한 범위에서만 자료를 주고받습니다", href: "./feature.html?f=share" },
      { label: "보안·권한", desc: "원가 원문 보호와 확인 이력", href: "./feature.html?f=security" },
    ],
  },
  { label: "도입 방식", href: "./pilot.html", page: "pilot" },
  {
    label: "고객 지원",
    page: "faq",
    items: [
      { label: "자주 묻는 질문", desc: "도입·비용·자료 보안", href: "./faq.html", page: "faq" },
      { label: "데모 화면 둘러보기", desc: "가상 데이터로 직접 눌러 봅니다", href: "./my.html" },
    ],
  },
  { label: "도입 문의", href: "./#contact" },
];

const isGroup = (e: NavEntry): e is NavGroup => "items" in e;
/** 지금 보고 있는 페이지면 표시 (상세 페이지는 ?f= 까지 같아야 함) */
const samePage = (href: string): boolean => {
  const u = new URL(href, location.href);
  return u.pathname === location.pathname && u.search === location.search && !u.hash;
};
const current = (page?: string, href?: string): string =>
  (page && page === document.body.dataset.page) || (href !== undefined && samePage(href)) ? ' aria-current="page"' : "";

const renderLink = (l: NavLink): string =>
  `<button class="drop-link" data-go="${esc(l.href)}"${current(l.page, l.href)}><strong>${esc(l.label)}</strong>${l.desc ? `<small>${esc(l.desc)}</small>` : ""}</button>`;

const renderEntry = (e: NavEntry, i: number): string => isGroup(e)
  ? `<div class="nav-item has-drop"><button class="nav-top" aria-expanded="false" aria-controls="drop-${i}"${current(e.page)}>${esc(e.label)}</button>`
    + `<div class="nav-drop" id="drop-${i}">${e.items.map(renderLink).join("")}</div></div>`
  : `<div class="nav-item"><button class="nav-top" data-go="${esc(e.href)}"${current(e.page)}>${esc(e.label)}</button></div>`;

const nav = document.querySelector<HTMLElement>("#home-nav");
if (nav) {
  nav.innerHTML = `<button class="home-logo" data-go="./" aria-label="Faccon 처음으로"><span class="brand-mark">F</span>Faccon</button>`
    + `<div class="home-links" id="home-links">${NAV.map(renderEntry).join("")}</div>`
    + `<div class="home-nav-actions"><button class="supplier-link" data-go="./login.html">초대받은 공급기업이십니까?</button>`
    + `<button class="login-btn" data-go="./login.html">로그인</button><button class="home-cta small" data-go="./#contact">도입 문의</button></div>`
    + `<button class="menu-toggle" aria-label="메뉴 열기" aria-expanded="false"><span></span><span></span><span></span></button>`;
}

const menu = document.querySelector<HTMLElement>("#home-links");
const menuButton = document.querySelector<HTMLButtonElement>(".menu-toggle");

const setMenu = (open: boolean): void => {
  menu?.classList.toggle("open", open);
  menuButton?.setAttribute("aria-expanded", String(open));
  menuButton?.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
};

const closeDrops = (except?: Element): void => {
  document.querySelectorAll(".nav-item.open").forEach((d) => {
    if (d === except) return;
    d.classList.remove("open");
    d.querySelector(".nav-top")?.setAttribute("aria-expanded", "false");
  });
};

const onHomePage = (): boolean => document.body.dataset.page === "home";

/** 같은 페이지 안(#…)이면 부드럽게 이동하고, 아니면 해당 페이지로 간다 */
const go = (raw: string): void => {
  setMenu(false);
  closeDrops();
  const target = raw.startsWith("./#") && onHomePage() ? raw.slice(1) : raw;
  if (!target.startsWith("#")) {
    location.href = target;
    return;
  }
  document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", target);
};

document.addEventListener("click", (e: MouseEvent): void => {
  const el = e.target instanceof Element ? e.target : null;
  if (!el) return;
  if (el.closest(".menu-toggle")) {
    setMenu(!menu?.classList.contains("open"));
    return;
  }
  const dropButton = el.closest(".has-drop > .nav-top");
  if (dropButton) {
    const item = dropButton.parentElement;
    const open = !item?.classList.contains("open");
    closeDrops(item ?? undefined);
    item?.classList.toggle("open", open);
    dropButton.setAttribute("aria-expanded", String(open));
    return;
  }
  const target = el.closest<HTMLElement>("[data-go]")?.dataset.go;
  if (target) {
    go(target);
    return;
  }
  if (!el.closest(".nav-item")) closeDrops();
});

document.addEventListener("keydown", (e: KeyboardEvent): void => {
  if (e.key === "Escape") closeDrops();
});
