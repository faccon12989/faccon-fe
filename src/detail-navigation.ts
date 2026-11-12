import type { DetailRoute } from "./types";

/** 예전 구매기업 요약 주소는 기업 대시보드로 통일합니다. */
export const resolveDetailRoute = (hash: string): DetailRoute => {
  const [, page, encodedId] = hash.split("/");
  if (page !== "contracts" && page !== "review" && page !== "reconcile" &&
      page !== "requests" && page !== "packages" && page !== "settlement" && page !== "supplier") {
    return { page: "summary" };
  }
  if (page !== "contracts" || !encodedId) return { page };
  try {
    return { page, id: decodeURIComponent(encodedId) };
  } catch {
    return { page: "contracts" };
  }
};

/** 요청 전에도 후속 업무를 바로 확인할 수 있는 상세 화면입니다. */
export const taskDetailHref = (taskId: string): string => {
  const path = taskId === "C-101" ? "contracts/ST-005"
    : taskId === "C-102" ? "reconcile"
    : taskId === "C-103" ? "review" : "contracts";
  return `./app.html#/${path}`;
};
