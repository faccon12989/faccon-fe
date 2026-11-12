import { describe, expect, it } from "vitest";
import { resolveDetailRoute, taskDetailHref } from "./detail-navigation";

describe("업무요약 통합 후 기존 진입 주소 호환", (): void => {
  it.each(["", "#/dashboard", "#/unknown"])("%s는 단일 업무요약으로 연결합니다", (hash: string): void => {
    expect(resolveDetailRoute(hash)).toEqual({ page: "summary" });
  });
  it("계약 상세 ID와 신규 검토·공급기업 진입은 유지합니다", (): void => {
    expect(resolveDetailRoute("#/contracts/ST-005")).toEqual({ page: "contracts", id: "ST-005" });
    expect(resolveDetailRoute("#/review")).toEqual({ page: "review" });
    expect(resolveDetailRoute("#/supplier")).toEqual({ page: "supplier" });
  });
  it("잘못된 주소 인코딩으로 전체 화면이 중단되지 않습니다", (): void => {
    expect(resolveDetailRoute("#/contracts/%E0")).toEqual({ page: "contracts" });
  });
  it("업무 종류에 맞는 후속 화면으로 연결합니다", (): void => {
    expect(taskDetailHref("C-101")).toBe("./app.html#/contracts/ST-005");
    expect(taskDetailHref("C-102")).toBe("./app.html#/reconcile");
    expect(taskDetailHref("C-103")).toBe("./app.html#/review");
  });
});
