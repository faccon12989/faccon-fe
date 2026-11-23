/* 소개·안내·로그인 페이지 공통: 위 머리 메뉴 + 아래 바닥글을 한 번에 붙입니다. */
import { mountSiteHeader } from "./site-header";
import { mountSiteFooter } from "./site-footer";

/** 본문의 <button data-go="./주소"> 단추를 누르면 해당 페이지로 이동합니다. */
const followDataGo = (e: MouseEvent): void => {
  const button = e.target instanceof Element ? e.target.closest<HTMLButtonElement>("button[data-go]") : null;
  const target = button?.dataset.go;
  if (target) location.href = target;
};

export const mountSiteChrome = (): void => {
  mountSiteHeader();
  mountSiteFooter();
  document.addEventListener("click", followDataGo);
};
