/* 가상 데이터. 회사·금액·지표는 모두 지어낸 값이다.
   AL-001은 기획서 부록 A의 계산 예시(10,000원 → 10,320원, 차액 320,000원)를 그대로 쓴다. */
import type {
  AccessLog, Company, Contract, DataRequest, ReconcileRow, SubmissionPackage, Todo,
} from "./types";

export const BUYER: Company = { id: "B-01", name: "A정밀 (가상)" };
/** 공급기업 역할로 볼 때의 자사 */
export const SELF_SUPPLIER = "S-01";

export const SUPPLIERS: readonly Company[] = [
  { id: "S-01", name: "동양알루텍 (가상)" },
  { id: "S-02", name: "성서정밀가공 (가상)" },
  { id: "S-03", name: "한빛금속 (가상)" },
  { id: "S-04", name: "대구캐스팅 (가상)" },
  { id: "S-05", name: "영남프레스 (가상)" },
];

export const CONTRACTS: readonly Contract[] = [
  { id: "AL-001", supplier: "S-01", item: "알루미늄 브래킷 BRK-7", material: "알루미늄 (주요 원재료 40%)", path: "A",
    p0: 10000, m0: 4000, i0: 100, it: 108, threshold: 5, qty: 1000, cycle: "월 1회", applyDay: "익월 1일 이후 검수분",
    index: "알루미늄 지수 (가상)", end: "2027-03-31", version: "v1.1", status: "ok", stepNow: 6 },
  { id: "AL-002", supplier: "S-02", item: "알루미늄 커버 CV-12", material: "알루미늄 (32%)", path: "A",
    p0: 8200, m0: 2600, i0: 100, it: 103, threshold: 5, qty: 2400, cycle: "월 1회", applyDay: "익월 1일 이후 발주분",
    index: "알루미늄 지수 (가상)", end: "2026-12-31", version: "v1.0", status: "ok", stepNow: 5 },
  { id: "CU-003", supplier: "S-03", item: "동 단자 TM-3", material: "구리 (46%)", path: "A",
    p0: 1500, m0: 690, i0: 100, it: 93, threshold: 5, qty: 18000, cycle: "분기 1회", applyDay: "분기 첫날 이후 발주분",
    index: "구리 지수 (가상)", end: "2027-06-30", version: "v2.0", status: "ok", stepNow: 6 },
  { id: "AL-004", supplier: "S-04", item: "다이캐스팅 하우징 HS-2", material: "알루미늄 합금 (51%)", path: "B",
    p0: 22000, m0: 11200, i0: 100, it: 106, threshold: 3, qty: 600, cycle: "월 1회", applyDay: "익월 1일 이후 검수분",
    index: "알루미늄 합금 지수 (가상)", end: "2027-01-31", version: "초안 v0.3", status: "draft", stepNow: 3 },
  { id: "ST-005", supplier: "S-05", item: "프레스 브래킷 PB-1", material: "냉연강판 (28%)", path: "A",
    p0: 3100, m0: 870, i0: 100, it: 101, threshold: 5, qty: 9000, cycle: "월 1회", applyDay: "익월 1일 이후 발주분",
    index: "냉연강판 지수 (가상)", end: "2026-10-31", version: "v1.0", status: "renew", stepNow: 5 },
];

/** 기획서 4.1 화면 예시: 담당자가 지금 처리할 항목 */
export const TODOS: readonly Todo[] = [
  { code: "C-101", contract: "ST-005", kind: "renew", title: "계약 갱신 검토", reason: "종료일(10/31) 이후에도 발주 2건 존재", next: "현행 약정 확인", go: "#/contracts/ST-005" },
  { code: "C-102", contract: "AL-001", kind: "unapplied", title: "조정단가 미반영", reason: "10,320원 계산 / 11월 발주 10,000원", next: "발주 단가 대조", go: "#/reconcile" },
  { code: "C-103", contract: "AL-004", kind: "missing", title: "자료 보완", reason: "투입량(제품당 원재료 사용량) 미확정", next: "해당 항목만 요청", go: "#/requests" },
];

export const MONTHS: readonly string[] = ["5월", "6월", "7월", "8월", "9월", "10월", "11월"];

/** 지표 관측값 (가상, 기준 100) */
export const INDEX_SERIES: Readonly<Record<string, readonly number[]>> = {
  "AL-001": [100, 101.2, 102.5, 101.8, 104.1, 106.0, 108.0],
  "AL-002": [100, 100.4, 101.1, 102.0, 102.6, 103.2, 103.0],
  "CU-003": [100, 98.6, 97.1, 95.8, 94.0, 93.4, 93.0],
  "AL-004": [100, 101.0, 102.3, 103.9, 104.4, 105.2, 106.0],
  "ST-005": [100, 100.2, 99.8, 100.5, 100.9, 101.2, 101.0],
};

/** 반영 대조: 가상 ERP 파일에서 가져온 발주·청구 단가 */
export const RECONCILE: readonly ReconcileRow[] = [
  { contract: "AL-001", po: "PO-2611-014", poPrice: 10000, invPrice: null, qty: 1000, paid: false },
  { contract: "AL-002", po: "PO-2611-021", poPrice: 8200, invPrice: 8200, qty: 2400, paid: false },
  { contract: "CU-003", po: "PO-2611-007", poPrice: 1452, invPrice: 1452, qty: 18000, paid: true },
  { contract: "ST-005", po: "PO-2611-030", poPrice: 3100, invPrice: null, qty: 9000, paid: false },
];

/** 기획서 4.2 수탁기업 자료 요청 */
export const REQUESTS: readonly DataRequest[] = [
  { id: "RQ-11", contract: "AL-004", supplier: "S-04", item: "제품당 알루미늄 투입량 (kg/개)", why: "원재료비 비중 확인 (주요 원재료 10% 판단)", period: "2026.08 ~ 2026.10", to: "A정밀 구매팀 · 원문 아님, 산정 결과만", state: "요청됨", reuse: null },
  { id: "RQ-12", contract: "AL-004", supplier: "S-04", item: "알루미늄 합금 매입 단가 근거", why: "기준 원재료비 M0 산정", period: "2026.10", to: "전문 검토자만 (기간 14일)", state: "원문 전용 제출", reuse: null },
  { id: "RQ-08", contract: "AL-001", supplier: "S-01", item: "원재료 비중 확인서", why: "약정 v1.1 근거", period: "2026 연간", to: "양사 공유 결과", state: "기존 자료 재사용 승인", reuse: "2026.03 제출본 (유효)" },
];

export const ACCESS_LOG: readonly AccessLog[] = [
  { contract: "AL-001", when: "11.08 14:22", who: "A정밀 (가상) 구매 김OO", what: "AL-001 산정 결과 열람", scope: "양사 공유 결과" },
  { contract: "AL-004", when: "11.05 10:03", who: "전문 검토자 (가상)", what: "AL-004 매입 단가 근거 열람", scope: "원문 · 승인 기간 내" },
  { contract: "AL-001", when: "10.30 16:40", who: "A정밀 (가상) 구매 김OO", what: "AL-001 원문 열람 시도", scope: "차단됨 (권한 없음)" },
];

/** 기획서 4.3 제출 패키지 */
export const PACKAGES: readonly SubmissionPackage[] = [
  { id: "PK-2026-01", purpose: "연동 우수기업 포상 서류", year: "2026", state: "초안",
    rows: [
      { req: "연동약정 체결 비율", value: "4 / 5 품목 (등록 계약 기준)", basis: "계약 목록 · 약정 v1.x", file: "약정서_AL-001_v1.1.pdf p.1-3" },
      { req: "연동 수탁기업 수", value: "4개사", basis: "약정 서명 이력", file: "서명이력_2026.csv" },
      { req: "납품대금 조정실적", value: "인상 320,000원 · 인하 864,000원", basis: "변동표 · 반영 대조", file: "변동표_2026-11.xlsx 시트2" },
    ] },
  { id: "PK-2026-02", purpose: "지원사업 후속관리", year: "2026", state: "제출 전 범위 승인 필요",
    rows: [
      { req: "지원 사건 약정 상태", value: "AL-004 초안 v0.3", basis: "약정 버전 이력", file: "약정초안_AL-004_v0.3.pdf" },
      { req: "조정·반영 여부", value: "해당 없음 (약정 전)", basis: "-", file: "-" },
    ] },
];
