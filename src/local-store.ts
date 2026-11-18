import type { LocalAdjustment, LocalSession, LocalStore, LocalTrade, Role } from "./types";
import { validateTerms } from "./local-workflow";

const STORE_KEY = "faccon.local-workspace.v1";
const SESSION_KEY = "faccon.local-session.v1";
const validateStoredTrade = (value: unknown): void => {
  if (!value || typeof value !== "object") throw new Error("거래 데이터가 올바르지 않습니다.");
  const trade = value as Partial<LocalTrade>;
  if (![trade.id, trade.title, trade.buyer, trade.supplier, trade.material, trade.createdAt, trade.request].every((item: unknown): boolean => typeof item === "string") || !trade.terms || !Array.isArray(trade.documents) || !Array.isArray(trade.events)) throw new Error("거래 데이터의 필수 항목을 확인할 수 없습니다.");
  validateTerms(trade.terms);
  const adjustments = [...(trade.adjustmentHistory ?? []), ...(trade.adjustment ? [trade.adjustment] : [])];
  if (adjustments.some((item: LocalAdjustment): boolean => !Number.isFinite(item.revision) || !Number.isFinite(item.indexValue))) throw new Error("저장된 조정 결과의 숫자 형식을 확인해 주세요.");
};
export const readSession = (): LocalSession | null => {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
    if (!value || typeof value !== "object") return null;
    const item = value as Partial<LocalSession>;
    return (item.role === "buyer" || item.role === "supplier") && typeof item.company === "string" && typeof item.name === "string" ? item as LocalSession : null;
  } catch { return null; }
};
export const saveSession = (session: LocalSession): void => sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
export const clearSession = (): void => sessionStorage.removeItem(SESSION_KEY);
export const readLocalStore = (): LocalStore => {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return { version: 1, trades: [] };
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 || !("trades" in value) || !Array.isArray(value.trades)) throw new Error("저장된 업무 데이터의 형식을 확인할 수 없습니다. 브라우저 저장소를 보존하고 담당자에게 알려 주세요.");
  value.trades.forEach((trade: unknown): void => validateStoredTrade(trade));
  return value as LocalStore;
};
export const saveLocalTrade = (trade: LocalTrade): void => {
  validateStoredTrade(trade);
  const store = readLocalStore();
  const exists = store.trades.some((row: LocalTrade): boolean => row.id === trade.id);
  const trades = exists ? store.trades.map((row: LocalTrade): LocalTrade => row.id === trade.id ? trade : row) : [...store.trades, trade];
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, trades }));
};
export const companyNames = (role: Role): readonly string[] => [...new Set(readLocalStore().trades.map((trade: LocalTrade): string => trade[role]))];
export const requireSession = (): LocalSession | null => {
  const session = readSession();
  if (!session) location.replace(`./login.html?next=${location.pathname.endsWith("start.html") ? "start" : "my"}`);
  return session;
};
