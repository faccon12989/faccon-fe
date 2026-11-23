/* 모든 페이지가 함께 쓰는 머리 메뉴 (소개 첫 화면과 같은 모양).
   메뉴를 바꾸려면 여기 NAV 한 곳만 고치면 모든 페이지에 똑같이 반영됩니다. */
import "./site-header.css";
import { esc } from "../ui";

interface NavLink {
  readonly label: string;
  readonly href: string;
  readonly desc?: string;
}
interface NavGroup {
  readonly label: string;
  readonly items: readonly NavLink[];
}
type NavEntry = NavLink | NavGroup;

const NAV: readonly NavEntry[] = [
  {
    label: "서비스 소개",
    items: [
      { label: "단가 계산", desc: "약정 산식 그대로 계산합니다", href: "./feature.html?f=calc" },
      { label: "반영 대조", desc: "발주서에 빠진 단가를 찾아냅니다", href: "./feature.html?f=recon" },
      { label: "자료 공유", desc: "정한 범위에서만 자료를 주고받습니다", href: "./feature.html?f=share" },
      { label: "보안·권한", desc: "원가 원문 보호와 확인 이력", href: "./feature.html?f=security" },
    ],
  },
  { label: "도입 방식", href: "./pilot.html" },
  {
    label: "고객 지원",
    items: [
      { label: "이용 가이드 및 자주 묻는 질문", desc: "도입·비용·자료 보안", href: "./faq.html" },
      { label: "데모 화면 둘러보기", desc: "가상 데이터로 직접 눌러 봅니다", href: "./my.html" },
    ],
  },
  { label: "도입 문의", href: "./consult.html" },
];

const HEADER_ID = "site-header";
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap";

const isGroup = (e: NavEntry): e is NavGroup => "items" in e;

/** 지금 보고 있는 페이지인지 (상세 페이지는 ?f= 까지 같아야 함) */
const isCurrent = (href: string): boolean => {
  const u = new URL(href, location.href);
  const path = (p: string): string => p.replace(/\/index\.html$/, "/");
  return path(u.pathname) === path(location.pathname) && (u.search === "" || u.search === location.search);
};
const currentAttr = (on: boolean): string => (on ? ' aria-current="page"' : "");

const renderLink = (l: NavLink): string =>
  `<a class="sh-drop-link" href="${esc(l.href)}"${currentAttr(isCurrent(l.href))}><strong>${esc(l.label)}</strong>${l.desc ? `<small>${esc(l.desc)}</small>` : ""}</a>`;

const renderEntry = (e: NavEntry, i: number): string => isGroup(e)
  ? `<div class="sh-item has-drop"><button type="button" class="sh-top" aria-expanded="false" aria-controls="sh-drop-${i}"${currentAttr(e.items.some((l: NavLink): boolean => isCurrent(l.href)))}>${esc(e.label)}</button>`
    + `<div class="sh-drop" id="sh-drop-${i}">${e.items.map(renderLink).join("")}</div></div>`
  : `<div class="sh-item"><a class="sh-top" href="${esc(e.href)}"${currentAttr(isCurrent(e.href))}>${esc(e.label)}</a></div>`;

/** 머리 메뉴 HTML. 화면 전체를 다시 그리는 페이지(내 업무)는 이 문자열을 맨 앞에 붙입니다. */
export const siteHeaderHtml = (): string =>
  `<header class="sh" id="${HEADER_ID}"><nav class="sh-inner" aria-label="주요 메뉴">`
  + `<a class="sh-logo" href="./" aria-label="Faccon 처음으로"><span class="sh-mark" aria-hidden="true">F</span>Faccon</a>`
  + `<div class="sh-links" id="sh-links">${NAV.map(renderEntry).join("")}<a class="sh-mobile-login" href="./login.html">기업 로그인</a></div>`
  + `<div class="sh-actions"><a class="sh-supplier" href="./login.html">수탁기업으로 참여하기</a>`
  + `<a class="sh-login" href="./login.html">로그인</a><a class="sh-cta" href="./consult.html">도입 문의</a></div>`
  + `<button type="button" class="sh-toggle" aria-label="메뉴 열기" aria-expanded="false" aria-controls="sh-links"><span></span><span></span><span></span></button>`
  + `</nav></header>`;

const ensureFont = (): void => {
  if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONT_HREF;
  document.head.append(link);
};

const setMenu = (open: boolean): void => {
  document.getElementById("sh-links")?.classList.toggle("open", open);
  const toggle = document.querySelector<HTMLButtonElement>(".sh-toggle");
  toggle?.setAttribute("aria-expanded", String(open));
  toggle?.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
};

const closeDrops = (except?: Element): void => {
  document.querySelectorAll(".sh-item.open").forEach((d: Element): void => {
    if (d === except) return;
    d.classList.remove("open");
    d.querySelector(".sh-top")?.setAttribute("aria-expanded", "false");
  });
};

const onClick = (e: MouseEvent): void => {
  const el = e.target instanceof Element ? e.target : null;
  if (!el) return;
  if (el.closest(".sh-toggle")) {
    setMenu(!document.getElementById("sh-links")?.classList.contains("open"));
    return;
  }
  const dropButton = el.closest(".has-drop > .sh-top");
  if (dropButton) {
    const item = dropButton.parentElement;
    const open = !item?.classList.contains("open");
    closeDrops(item ?? undefined);
    item?.classList.toggle("open", open);
    dropButton.setAttribute("aria-expanded", String(open));
    return;
  }
  if (!el.closest(".sh-item")) closeDrops();
};

/** 페이지 맨 위에 머리 메뉴를 붙이고, 펼침 메뉴·휴대폰 메뉴 동작을 연결합니다. */
export const mountSiteHeader = (): void => {
  ensureFont();
  if (document.getElementById(HEADER_ID)) return;
  const skip = document.querySelector(".skip-link");
  if (skip) skip.insertAdjacentHTML("afterend", siteHeaderHtml());
  else document.body.insertAdjacentHTML("afterbegin", siteHeaderHtml());
};

document.addEventListener("click", onClick);
document.addEventListener("keydown", (e: KeyboardEvent): void => {
  if (e.key !== "Escape") return;
  closeDrops();
  setMenu(false);
});
