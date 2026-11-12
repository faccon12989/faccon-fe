import { adjust } from "./calc";
import { demoContracts } from "./demo";
import { csvCell } from "./evidence";
import type { Contract } from "./types";
export const monthlyRows = (id?: string): readonly (readonly string[])[] => demoContracts()
  .filter((c: Contract): boolean => c.status === "ok" && (!id || c.id === id))
  .map((c: Contract): readonly string[] => { const result = adjust(c); return [c.id, c.version, c.index, String(c.i0), String(c.it), `${c.threshold}%`, String(c.p0), String(result.price), String(c.qty), String(result.total), c.applyDay, "가상 예시·지급 실적 아님"]; });
export const downloadMonthly = (id?: string): void => {
  const header = ["약정", "버전", "지표", "기준지수", "비교지수", "요건", "기준단가", "계산단가", "적용수량", "계산차액", "적용기준", "자료성격"];
  const csv = [header, ...monthlyRows(id)].map((row: readonly string[]): string => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `단가변동표_${id ?? "전체"}_2026-11.csv`; link.click();
  window.setTimeout((): void => URL.revokeObjectURL(url), 1000);
};
