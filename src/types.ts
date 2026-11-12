/** 화면에서 쓰는 도메인 타입. 모든 값은 가상 데이터다. */

export type Role = "buyer" | "supplier";
export type EntryPath = "A" | "B";
/** ok 운영 중 · draft 약정 준비 · renew 갱신 검토 · nolink 미연동 합의(연동하지 않기로 양사 합의) */
export type ContractStatus = "ok" | "draft" | "renew" | "nolink";
export type Channel = "kakao" | "email" | "sms";
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
  /** 미연동 합의일 때만: 사유와 보관 문서 */
  noLink?: Readonly<{ reason: string; agreedOn: string; doc: string }>;
}

/** 누가 올리고, 누가 확인하고, 누가 승인했는지 */
export interface Trail {
  contract: string;
  uploaded: string;
  checked: string;
  approved: string | null;
}

/** 제도·법령 변경 소식 */
export interface Notice {
  date: string;
  title: string;
  body: string;
  impact: string;
}

/** 제출 목적별로 필요한 자료 */
export interface Purpose {
  id: string;
  name: string;
  note: string;
  items: readonly Readonly<{ doc: string; ready: boolean }>[];
}

export interface Todo {
  code: string;
  contract: string;
  kind: TodoKind;
  title: string;
  reason: string;
  next: string;
  go: string;
  /** 화면을 열기 전에 보낸 알림 */
  notified: string;
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
