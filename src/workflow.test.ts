import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_WORK, transition } from "./workflow";
import { readContext, setContext } from "./context";
import { demoContracts, demoRows, taskDone } from "./demo";
import { isCounted } from "./data";
import { evidenceRows } from "./evidence";
import { monthlyRows } from "./monthly";
import type { WorkState, WorkCommand } from "./types";

const step = (s: WorkState, input: Partial<WorkCommand>): WorkState => transition(s, { action: "request", role: "buyer", supplier: "S-04", revision: s.revision, ...input });
const submitted = (): WorkState => step(step(EMPTY_WORK, {}), { action: "submit", role: "supplier", checked: true, m0: 11200 });
const active = (): WorkState => step(submitted(), { action: "approve", checked: true });
const storage = (): void => {
  const map = new Map<string, string>();
  const store = { getItem: (key: string): string | null => map.get(key) ?? null, setItem: (key: string, value: string): void => { map.set(key, value); } };
  vi.stubGlobal("localStorage", store); vi.stubGlobal("sessionStorage", store);
};
afterEach((): void => { vi.unstubAllGlobals(); });
describe("양사 연결 업무", (): void => {
  it("구매기업은 공급기업 보완·공유승인 없이 약정을 확정할 수 없다", (): void => {
    expect((): WorkState => step(EMPTY_WORK, { action: "approve", checked: true })).toThrow();
    expect((): WorkState => step(submitted(), { action: "approve", checked: false })).toThrow();
    expect(active().phase).toBe("active");
  });
  it("다른 공급기업과 구매기업은 공급기업 제출을 대신할 수 없다", (): void => {
    const s = step(EMPTY_WORK, {});
    expect((): WorkState => step(s, { action: "submit", role: "supplier", supplier: "S-01", m0: 11200, checked: true })).toThrow();
    expect((): WorkState => step(s, { action: "submit", role: "buyer", m0: 11200, checked: true })).toThrow();
  });
  it("보완 요청 후 새 제출을 받아야 하며 오래된 화면에서는 승인할 수 없다", (): void => {
    const first = submitted();
    const returned = step(first, { action: "return", note: "기준월 확인" });
    expect((): WorkState => step(returned, { action: "approve", checked: true })).toThrow();
    const second = step(returned, { action: "submit", role: "supplier", checked: true, m0: 11200 });
    expect((): WorkState => step(second, { action: "approve", checked: true, revision: first.revision })).toThrow();
    expect(step(second, { action: "approve", checked: true }).phase).toBe("active");
  });
  it("잘못된 단가와 확인 없는 제출을 거절한다", (): void => {
    const s = step(EMPTY_WORK, {});
    for (const m0 of [-1, 0, NaN, Infinity, 22001]) expect((): WorkState => step(s, { action: "submit", role: "supplier", checked: true, m0 })).toThrow();
    expect((): WorkState => step(s, { action: "submit", role: "supplier", checked: false, m0: 11200 })).toThrow();
  });
  it("발주→공급기업 청구→구매기업 지급근거 순서와 역할을 지킨다", (): void => {
    const s = active();
    expect((): WorkState => step(s, { action: "payment", checked: true })).toThrow();
    const po = step(s, { action: "po", checked: true });
    expect((): WorkState => step(po, { action: "invoice", checked: true })).toThrow();
    const invoice = step(po, { action: "invoice", role: "supplier", checked: true });
    const done = step(invoice, { action: "payment", checked: true });
    expect(done.evidence).toBe(3);
    expect((): WorkState => step(done, { action: "payment", checked: true })).toThrow();
  });
  it("갱신은 해당 공급기업과 구매기업의 확인 후 완료된다", (): void => {
    const proposed = step(EMPTY_WORK, { action: "proposeRenew", checked: true });
    expect((): WorkState => step(proposed, { action: "confirmRenew", checked: true })).toThrow();
    expect((): WorkState => step(proposed, { action: "acceptRenew", role: "supplier", checked: true })).toThrow();
    const accepted = step(proposed, { action: "acceptRenew", role: "supplier", supplier: "S-05", checked: true });
    expect(step(accepted, { action: "confirmRenew", checked: true }).renew).toBe("active");
  });
  it("역할과 공급기업 선택을 저장하고 자사 증빙만 출력한다", (): void => {
    storage(); setContext("supplier", "S-04");
    expect(readContext()).toEqual({ role: "supplier", supplier: "S-04" });
    expect(evidenceRows("supplier").map((x): string => x[0] ?? "")).toEqual(["AL-004"]);
    setContext("supplier", "S-01");
    expect(evidenceRows("supplier").map((x): string => x[0] ?? "")).toEqual(["AL-001"]);
  });
  it("초기 운영 집계·CSV는 종료 약정을 빼고 갱신되면 동일하게 포함한다", (): void => {
    storage();
    expect(demoContracts().filter(isCounted)).toHaveLength(3);
    expect(monthlyRows().map((row): string => row[0] ?? "")).not.toContain("ST-005");
    localStorage.setItem("faccon-work-v1", JSON.stringify({ ...EMPTY_WORK, renew: "active" }));
    expect(demoContracts().filter(isCounted)).toHaveLength(4);
    expect(taskDone("C-101")).toBe(true);
    expect(monthlyRows().map((row): string => row[0] ?? "")).toContain("ST-005");
  });
  it("새 약정의 확정 단가를 발주·청구·증빙에 공통 반영한다", (): void => {
    storage(); localStorage.setItem("faccon-work-v1", JSON.stringify({ ...active(), evidence: 3 }));
    expect(demoContracts().find((c): boolean => c.id === "AL-004")?.m0).toBe(11200);
    expect(demoRows().find((row): boolean => row.contract === "AL-004")?.invPrice).toBe(22672);
    expect(evidenceRows("buyer").find((row): boolean => row[0] === "AL-004")?.[8]).toBe("가상 지급근거 확인");
  });
});
