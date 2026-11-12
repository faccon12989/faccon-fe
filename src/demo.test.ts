import { afterEach, describe, expect, it, vi } from "vitest";
import { CONTRACTS, RECONCILE } from "./data";
import { EMPTY_DEMO, demoRows, nextEvidence, parseDemo, reconcileChecks, taskDone, taskStatus } from "./demo";
import { csvCell, evidenceRows } from "./evidence";
import { requestsView } from "./views/operations";
import type { Contract, ReconcileRow } from "./types";

afterEach((): void => { vi.unstubAllGlobals(); });
describe("가상 업무 상태", (): void => {
  it("요청을 보내도 발주 반영 전에는 완료되지 않는다", (): void => {
    const s = { ...EMPTY_DEMO, requests: [{ id: "C-102", choice: "request", detail: "ERP" }] };
    expect(taskStatus("C-102", s)).toBe("ERP 반영 대기");
    expect(taskDone("C-102", s)).toBe(false);
    expect(taskDone("C-102", { ...s, po: true })).toBe(true);
  });
  it("갱신 선택별로 서로 다른 대기 상태를 유지한다", (): void => {
    const statuses = ["extend", "end", "check"].map((choice: string): string => taskStatus("C-101", { ...EMPTY_DEMO, requests: [{ id: "C-101", choice, detail: "" }] }));
    expect(new Set(statuses).size).toBe(3);
    expect(taskDone("C-101", { ...EMPTY_DEMO, requests: [{ id: "C-101", choice: "end", detail: "" }] })).toBe(false);
  });
  it("청구 일치가 발주 불일치를 완료로 바꾸지 않는다", (): void => {
    const c = CONTRACTS.find((x: Contract): boolean => x.id === "AL-001") as Contract;
    const row = RECONCILE[0] as ReconcileRow;
    expect(reconcileChecks({ ...row, invPrice: 10320, paid: true }, c)).toEqual([true, false, true, true]);
  });
  it("발주, 청구, 지급근거를 순서대로 반영하며 시뮬레이션 지급은 섞지 않는다", (): void => {
    const po = { ...EMPTY_DEMO, ...nextEvidence(EMPTY_DEMO) };
    expect(demoRows(po)[0]?.invPrice).toBe(null);
    const inv = { ...po, ...nextEvidence(po) };
    expect(demoRows(inv)[0]?.paid).toBe(false);
    expect(demoRows({ ...EMPTY_DEMO, deposited: true, paid: true })[0]?.paid).toBe(false);
  });
  it("오염된 저장 자료를 초기화하고 청구·지급 상태의 선행조건을 지킨다", (): void => {
    expect(parseDemo("broken")).toEqual(EMPTY_DEMO);
    expect(parseDemo(JSON.stringify({ ...EMPTY_DEMO, draftM0: -1 }))).toEqual(EMPTY_DEMO);
    expect(parseDemo(JSON.stringify({ ...EMPTY_DEMO, invoice: true, payment: true })).payment).toBe(false);
    expect(parseDemo(JSON.stringify({ ...EMPTY_DEMO, requests: [{}] }))).toEqual(EMPTY_DEMO);
  });
});
describe("공유 범위와 증빙", (): void => {
  it("공급기업에 다른 회사의 요청·열람 이력을 보여주지 않는다", (): void => {
    const html = requestsView("supplier");
    expect(html).toContain("RQ-08");
    expect(html).not.toContain("RQ-11");
    expect(html).not.toContain("AL-004");
    expect(html).not.toContain("대구캐스팅");
  });
  it("초안과 종료 약정을 계산 실적에 포함하지 않으며 자사 계약만 출력한다", (): void => {
    const rows = evidenceRows("buyer");
    expect(rows.find((r: readonly string[]): boolean => r[0] === "AL-004")?.[5]).toBe("집계 제외");
    expect(rows.find((r: readonly string[]): boolean => r[0] === "ST-005")?.[5]).toBe("집계 제외");
    expect(evidenceRows("supplier").map((r: readonly string[]): string | undefined => r[0])).toEqual(["AL-001"]);
  });
  it("자료가 반영되면 출력 데이터에도 동일하게 반영한다", (): void => {
    vi.stubGlobal("localStorage", { getItem: (): string => JSON.stringify({ ...EMPTY_DEMO, po: true, invoice: true, payment: true }) });
    const row = evidenceRows("buyer")[0];
    expect(row?.[6]).toBe("10,320원");
    expect(row?.[7]).toBe("10,320원");
    expect(row?.[8]).toBe("가상 지급근거 확인");
  });
  it("CSV 수식 실행과 따옴표 깨짐을 막는다", (): void => {
    expect(csvCell("=1+1")).toBe('"\'=1+1"');
    expect(csvCell('가상 "자료"')).toBe('"가상 ""자료"""');
  });
});
