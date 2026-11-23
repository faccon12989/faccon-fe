/* 모든 소개 페이지가 함께 쓰는 바닥글 (소개 첫 화면과 같은 모양).
   <footer id="site-footer"></footer> 자리에 채웁니다. 자리가 없으면 본문 끝에 붙입니다. */
import "./site-footer.css";
import { esc } from "../ui";

interface FooterLink {
  readonly label: string;
  readonly href: string;
}

const LINKS: readonly FooterLink[] = [
  { label: "서비스 소개", href: "./feature.html?f=calc" },
  { label: "도입 방식", href: "./pilot.html" },
  { label: "이용 가이드", href: "./faq.html" },
  { label: "도입 상담", href: "./consult.html" },
  { label: "기업 로그인", href: "./login.html" },
];

const footerInner = (): string =>
  `<div class="sf-brand"><span class="sf-mark" aria-hidden="true">F</span><div><strong>Faccon</strong><small>단가 조정 효율화 서비스</small></div></div>`
  + `<nav class="sf-links" aria-label="바닥 메뉴">${LINKS.map((l: FooterLink): string => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join("")}</nav>`
  + `<p>© 2026 Faccon · 화면의 회사·거래·금액은 모두 가상 데이터입니다.</p>`;

export const mountSiteFooter = (): void => {
  const slot = document.getElementById("site-footer");
  if (slot) {
    slot.className = "sf";
    slot.innerHTML = footerInner();
    return;
  }
  document.body.insertAdjacentHTML("beforeend", `<footer class="sf" id="site-footer">${footerInner()}</footer>`);
};
