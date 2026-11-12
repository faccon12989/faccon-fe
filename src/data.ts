/* 가상 데이터. 회사·금액·지표는 모두 지어낸 값이다.
   AL-001은 기획서 부록 A의 계산 예시(10,000원 → 10,320원, 차액 320,000원)를 그대로 쓴다. */
import type {
  AccessLog, Company, Contract, DataRequest, Notice, Purpose, ReconcileRow, SubmissionPackage, Todo, Trail,
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
  { id: "S-06", name: "경산고무 (가상)" },
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
  { id: "NL-006", supplier: "S-06", item: "방진 고무 패드 RP-4", material: "합성고무 (12%)", path: "A",
    p0: 950, m0: 114, i0: 100, it: 104, threshold: 5, qty: 30000, cycle: "-", applyDay: "-",
    index: "-", end: "2026-12-31", version: "미연동 합의서", status: "nolink", stepNow: 4,
    noLink: { reason: "60일 단기 계약 · 양사가 연동하지 않기로 서면 합의", agreedOn: "2026-11-02", doc: "미연동합의서_NL-006.pdf" } },
];

/** 단가 조정 합계에 들어가는 약정: 운영 중이거나 갱신 검토 중인 것 (준비 중·미연동 합의 제외) */
export const isCounted = (c: Readonly<Contract>): boolean => c.status === "ok" || c.status === "renew";

/** 기획서 4.1 화면 예시: 담당자가 지금 처리할 항목 */
export const TODOS: readonly Todo[] = [
  { code: "C-101", contract: "ST-005", kind: "renew", title: "계약 갱신 검토", reason: "종료일(10/31) 이후에도 발주 2건 존재", next: "현행 약정 확인", go: "#/contracts/ST-005", notified: "알림톡 · 11/03 09:00" },
  { code: "C-102", contract: "AL-001", kind: "unapplied", title: "조정단가 미반영", reason: "10,320원 계산 / 11월 발주 10,000원", next: "발주 단가 대조", go: "#/reconcile", notified: "알림톡·메일 · 11/01 08:30" },
  { code: "C-103", contract: "AL-004", kind: "missing", title: "자료 보완", reason: "투입량(제품당 원재료 사용량) 미확정", next: "해당 항목만 요청", go: "#/requests", notified: "메일 · 11/05 10:00" },
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
  { when: "11.08 14:22", who: "A정밀 구매 김OO", what: "AL-001 산정 결과 열람", scope: "양사 공유 결과" },
  { when: "11.05 10:03", who: "전문 검토자 (가상)", what: "AL-004 매입 단가 근거 열람", scope: "원문 · 승인 기간 내" },
  { when: "10.30 16:40", who: "A정밀 구매 김OO", what: "AL-001 원문 열람 시도", scope: "차단됨 (권한 없음)" },
];

/** 기획서 4.3 제출 패키지 */
export const PACKAGES: readonly SubmissionPackage[] = [
  { id: "PK-2026-01", purpose: "연동 우수기업 포상 서류", year: "2026", state: "초안",
    rows: [
      { req: "연동약정 체결 비율", value: "4 / 6 품목 (미연동 합의 1건 별도 표기)", basis: "계약 목록 · 약정 v1.x", file: "약정서_AL-001_v1.1.pdf p.1-3" },
      { req: "연동 수탁기업 수", value: "4개사", basis: "약정 서명 이력", file: "서명이력_2026.csv" },
      { req: "납품대금 조정실적", value: "인상 320,000원 · 인하 864,000원", basis: "변동표 · 반영 대조", file: "변동표_2026-11.xlsx 시트2" },
    ] },
  { id: "PK-2026-02", purpose: "지원사업 후속관리", year: "2026", state: "제출 전 범위 승인 필요",
    rows: [
      { req: "지원 사건 약정 상태", value: "AL-004 초안 v0.3", basis: "약정 버전 이력", file: "약정초안_AL-004_v0.3.pdf" },
      { req: "조정·반영 여부", value: "해당 없음 (약정 전)", basis: "-", file: "-" },
    ] },
];

/** 누가 올리고 확인하고 승인했는지 (가상 이름) */
export const TRAILS: readonly Trail[] = [
  { contract: "AL-001", uploaded: "A정밀 구매 김OO · 03/02", checked: "동양알루텍 영업 박OO · 03/04", approved: "A정밀 구매팀장 이OO · 03/05" },
  { contract: "AL-002", uploaded: "A정밀 구매 김OO · 01/10", checked: "성서정밀가공 대표 최OO · 01/12", approved: "A정밀 구매팀장 이OO · 01/13" },
  { contract: "CU-003", uploaded: "한빛금속 관리 정OO · 06/20", checked: "A정밀 구매 김OO · 06/21", approved: "A정밀 구매팀장 이OO · 06/24" },
  { contract: "AL-004", uploaded: "A정밀 구매 김OO · 10/28", checked: "대구캐스팅 · 투입량 확인 중", approved: null },
  { contract: "ST-005", uploaded: "A정밀 구매 김OO · 2025/11/01", checked: "영남프레스 관리 한OO · 2025/11/03", approved: "A정밀 구매팀장 이OO · 2025/11/04" },
  { contract: "NL-006", uploaded: "A정밀 구매 김OO · 11/02", checked: "경산고무 대표 윤OO · 11/02", approved: "A정밀 구매팀장 이OO · 11/03" },
];

/** 제도 변경 소식 (기획서 조사 기준 · 데모) */
export const NOTICES: readonly Notice[] = [
  { date: "2026.08.11", title: "하도급법: 에너지 비용도 연동 대상으로", body: "하도급 거래에서 전기·가스 등 에너지 비용 변동도 연동할 수 있게 됐어요.", impact: "내 약정 6건 중 하도급 거래 0건 · 바로 바뀌는 것 없음" },
  { date: "2026.12.03 예정", title: "상생협력법: 에너지 연동 시행 예정", body: "위·수탁 거래에도 에너지 비용 연동이 시행될 예정이에요. 시행 전에 대상 품목을 다시 확인해 드릴게요.", impact: "프레스 브래킷 PB-1 · 전력 사용 많음 · 검토 후보" },
];

/** 제출 목적별로 필요한 자료. 실제 요구 항목은 공고마다 다르므로 공고를 올리면 그 기준으로 맞춘다. */
export const PURPOSES: readonly Purpose[] = [
  { id: "award", name: "연동 우수기업 포상 신청", note: "공고의 평가 항목에 맞춰 체결 비율·조정 실적을 계산해요",
    items: [{ doc: "연동약정서 (체결된 4건)", ready: true }, { doc: "11월 변동표 · 조정 실적", ready: true }, { doc: "발주·청구 반영 확인", ready: false }, { doc: "미연동 합의서 (1건, 별도 표기)", ready: true }] },
  { id: "survey", name: "실태조사·직권조사 대응", note: "요청받은 계약만 골라 약정·갱신 이력을 묶어요",
    items: [{ doc: "계약별 약정서와 버전 이력", ready: true }, { doc: "계약 종료 후 발주 갱신 확인", ready: false }, { doc: "미연동 합의 사유·서면", ready: true }] },
  { id: "grant", name: "지원사업 결과 보고", note: "지원받은 거래의 약정 상태와 조정 여부만 담아요",
    items: [{ doc: "지원 거래 약정 상태 (AL-004 초안)", ready: true }, { doc: "조정·반영 여부", ready: false }] },
];
