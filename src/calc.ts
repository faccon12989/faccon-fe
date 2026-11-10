/* 약정 산식 계산 (기획서 부록 A).
   Pt = P0 + M0 × (It − I0) ÷ I0, 원 단위 반올림.
   변동률이 요건(±threshold%) 미만이면 조정하지 않는다. LLM을 쓰지 않는 결정적 계산이다. */
import type { AdjustResult, Contract } from "./types";

const EPSILON = 1e-9;

export const adjust = (c: Readonly<Contract>, it: number = c.it): AdjustResult => {
  const rate = (it - c.i0) / c.i0;
  const triggered = Math.abs(rate) * 100 >= c.threshold - EPSILON;
  const raw = triggered ? c.p0 + (c.m0 * (it - c.i0)) / c.i0 : c.p0;
  const price = Math.round(raw);
  const diffPerUnit = price - c.p0;
  return { it, rate, triggered, price, diffPerUnit, total: diffPerUnit * c.qty };
};

export const won = (n: number | null | undefined): string => {
  return n == null ? "-" : `${Math.round(n).toLocaleString("ko-KR")}원`;
};

export const pct = (rate: number): string => {
  return `${(rate * 100).toFixed(1).replace("-0.0", "0.0")}%`;
};

export const signedWon = (n: number): string => {
  return `${n > 0 ? "+" : ""}${won(n)}`;
};
