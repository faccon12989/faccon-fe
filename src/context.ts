import type { DemoContext, Role } from "./types";
const KEY = "faccon-role-v1";
export const readContext = (): DemoContext => {
  try {
    const x: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    if (typeof x === "object" && x !== null && "role" in x && "supplier" in x
      && (x.role === "buyer" || x.role === "supplier") && typeof x.supplier === "string"
      && ["S-01", "S-02", "S-03", "S-04", "S-05", "S-06"].includes(x.supplier)) return { role: x.role, supplier: x.supplier };
  } catch { /* 저장이 불가능하면 기본 가상 역할로 표시합니다. */ }
  return { role: "buyer", supplier: "S-01" };
};
export const setContext = (role: Role, supplier: string = readContext().supplier): void => {
  sessionStorage.setItem(KEY, JSON.stringify({ role, supplier }));
};
export const activeSupplier = (): string => readContext().supplier;
