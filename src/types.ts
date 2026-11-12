/** 화면에서 쓰는 도메인 타입. 모든 값은 가상 데이터다. */

export type Role = "buyer" | "supplier";
export type EntryPath = "A" | "B";
export type ContractStatus = "ok" | "draft" | "renew";
export type TodoKind = "renew" | "unapplied" | "missing";

export interface Company {
  id: string;
  name: string;
}

export interface Contract {
  id: string;
  supplier: string;
  item: string;
  material: string;
  path: EntryPath;
  /** 기준 납품단가 P0 (원/개) */
  p0: number;
  /** 제품당 원재료비 M0 (원/개) */
  m0: number;
  /** 기준 지표 I0 */
  i0: number;
  /** 비교 지표 It */
  it: number;
  /** 조정 요건 ±% */
  threshold: number;
  qty: number;
  cycle: string;
  applyDay: string;
  index: string;
  end: string;
  version: string;
  status: ContractStatus;
  /** 01~08 중 현재 단계 */
  stepNow: number;
}

export interface Todo {
  code: string;
  contract: string;
  kind: TodoKind;
  title: string;
  reason: string;
  next: string;
  go: string;
}

export interface ReconcileRow {
  contract: string;
  po: string;
  poPrice: number;
  invPrice: number | null;
  qty: number;
  paid: boolean;
}

export interface DataRequest {
  id: string;
  contract: string;
  supplier: string;
  item: string;
  why: string;
  period: string;
  to: string;
  state: string;
  reuse: string | null;
}

export interface AccessLog {
  contract: string;
  when: string;
  who: string;
  what: string;
  scope: string;
}

export interface PackageRow {
  req: string;
  value: string;
  basis: string;
  file: string;
}

export interface SubmissionPackage {
  id: string;
  purpose: string;
  year: string;
  state: string;
  rows: readonly PackageRow[];
}

export interface AdjustResult {
  it: number;
  rate: number;
  triggered: boolean;
  price: number;
  diffPerUnit: number;
  total: number;
}

export interface AppState {
  readonly role: Role;
  readonly deposited: boolean;
  readonly paid: boolean;
}

export interface TaskRequest {
  readonly id: string;
  readonly choice: string;
  readonly detail: string;
}
export interface DemoState {
  readonly version: 2;
  readonly requests: readonly TaskRequest[];
  readonly po: boolean;
  readonly invoice: boolean;
  readonly payment: boolean;
  readonly setup: EntryPath | null;
  readonly draftApproved: boolean;
  readonly draftM0: number;
  readonly deposited: boolean;
  readonly paid: boolean;
}
