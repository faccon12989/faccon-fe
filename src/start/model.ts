/* 시작하기(온보딩) 상태와 검증. 상태는 항상 새 객체로 바꾼다. */

export type StartPath = "A" | "B";
export type ShareScope = "result" | "result+summary";

export interface Extracted {
  key: string;
  label: string;
  value: string;
  source: string;
  /** 추출 신뢰도 0~1 (가상) */
  confidence: number;
  confirmed: boolean;
}

export interface Invite {
  company: string;
  email: string;
}

export interface StartState {
  readonly step: number;
  readonly path: StartPath | null;
  readonly company: string;
  readonly manager: string;
  readonly email: string;
  readonly approver: string;
  readonly category: string;
  readonly uploaded: boolean;
  readonly extracted: readonly Extracted[];
  readonly checklist: readonly string[];
  readonly invites: readonly Invite[];
  readonly shareScope: ShareScope;
  readonly erpUploaded: boolean;
  readonly mapping: Readonly<Record<string, string>>;
  readonly measureConsent: boolean;
  readonly done: boolean;
}

export const STEP_TITLES = ["시작 방식", "회사·담당자", "약정 가져오기", "공급기업 초대", "ERP 파일 연결", "확인·시작"] as const;
export const LAST_STEP = STEP_TITLES.length - 1;

export const INITIAL: StartState = {
  step: 0, path: null, company: "", manager: "", email: "", approver: "", category: "",
  uploaded: false, extracted: [], checklist: [], invites: [{ company: "", email: "" }],
  shareScope: "result", erpUploaded: false, mapping: {}, measureConsent: false, done: false,
};

/** 가상 약정서에서 뽑았다고 가정한 값 (기획서 부록 A 예시와 같은 조건) */
export const MOCK_EXTRACTION: readonly Extracted[] = [
  { key: "p0", label: "기준 납품단가 P0", value: "10,000원 / 개", source: "약정서 p.2 표1", confidence: 0.98, confirmed: false },
  { key: "m0", label: "제품당 원재료비 M0", value: "4,000원 / 개 (40%)", source: "비중 확인서 p.1", confidence: 0.95, confirmed: false },
  { key: "index", label: "기준 지표", value: "알루미늄 지수 · 기준 100", source: "약정서 p.3 제4조", confidence: 0.91, confirmed: false },
  { key: "trigger", label: "조정 요건", value: "±5% 이상 · 월 1회", source: "약정서 p.3 제5조", confidence: 0.93, confirmed: false },
  { key: "apply", label: "적용일", value: "확인 필요 — 문서에 '익월'만 있음", source: "약정서 p.4 제6조", confidence: 0.52, confirmed: false },
];

/** B 경로: 새로 약정할 때 준비할 자료 */
export const B_CHECKLIST: readonly string[] = [
  "대상 품목과 거래 계약서",
  "최근 3개월 원재료 매입 내역 (공급기업 보유)",
  "제품당 원재료 투입량 (BOM)",
  "쓸 수 있는 가격 지표 후보",
];

export const ERP_FIELDS = ["발주번호", "품목코드", "발주단가", "수량", "발주일"] as const;
export const CSV_COLUMNS = ["PO_NO", "ITEM_CD", "UNIT_PRC", "QTY", "ORD_DT", "VENDOR_CD"] as const;
export const AUTO_MAPPING: Readonly<Record<string, string>> = {
  발주번호: "PO_NO", 품목코드: "ITEM_CD", 발주단가: "UNIT_PRC", 수량: "QTY", 발주일: "ORD_DT",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const update = (s: StartState, patch: Partial<StartState>): StartState => {
  return { ...s, ...patch };
};

/** 현재 단계에서 다음으로 넘어갈 수 없는 이유. 없으면 null. */
export const validate = (s: StartState): string | null => {
  switch (s.step) {
    case 0:
      return s.path ? null : "시작 방식을 골라 주세요.";
    case 1:
      if (!s.company.trim()) return "회사명을 입력해 주세요.";
      if (!s.manager.trim()) return "담당자 이름을 입력해 주세요.";
      if (!EMAIL_RE.test(s.email.trim())) return "담당자 이메일을 확인해 주세요.";
      return null;
    case 2:
      if (s.path === "B") return s.checklist.length ? null : "준비할 수 있는 자료를 하나 이상 골라 주세요.";
      if (!s.uploaded) return "약정 파일을 올려 주세요.";
      return s.extracted.every((x) => x.confirmed && x.confidence >= 0.8) ? null : "추출된 값을 원문과 비교해 모두 확인해 주세요.";
    case 3: {
      const filled = s.invites.filter((i) => i.company.trim() || i.email.trim());
      if (!filled.length) return null;
      const bad = filled.find((i) => !i.company.trim() || !EMAIL_RE.test(i.email.trim()));
      return bad ? "초대할 공급기업의 회사명과 이메일을 확인해 주세요." : null;
    }
    case 4:
      if (!s.erpUploaded) return "발주 파일을 올려 주세요. 없으면 '나중에 연결'을 누르세요.";
      if (new Set(ERP_FIELDS.map((f): string => s.mapping[f] ?? "")).size !== ERP_FIELDS.length) return "각 항목은 서로 다른 열에 연결해 주세요.";
      return ERP_FIELDS.every((f) => s.mapping[f]) ? null : "필수 항목의 열을 모두 골라 주세요.";
    case 5:
      return null;
    default:
      return null;
  }
};
