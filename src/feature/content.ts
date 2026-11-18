/* 서비스 소개 상세 페이지 내용. 문구는 소개 페이지·FAQ·데모 화면·개발 인계 자료에 있는 내용만 쓴다. */

export type FeatureId = "calc" | "recon" | "share" | "security";

export interface FeaturePoint {
  readonly title: string;
  readonly body: string;
}

export interface Feature {
  readonly id: FeatureId;
  readonly label: string;
  readonly summary: string;
  /** 제목. <em>…</em>으로 강조할 부분을 감싼다 (내용은 고정 문구라 그대로 넣는다) */
  readonly titleHtml: string;
  readonly lead: string;
  readonly shot?: { readonly src: string; readonly width: number; readonly height: number; readonly alt: string };
  readonly example?: readonly (readonly [string, string])[];
  readonly points: readonly FeaturePoint[];
  readonly note?: string;
}

export const FEATURES: readonly Feature[] = [
  {
    id: "calc",
    label: "단가 계산",
    summary: "약정 산식 그대로 계산합니다",
    titleHtml: "약정 산식 그대로, <em>매달 단가를 계산</em>합니다",
    lead: "약정서에 적힌 기준 단가·원재료비·지표·조정 요건으로 이번 달 조정단가를 계산합니다. 금액은 AI가 아니라 정해진 산식이 냅니다.",
    shot: { src: "./feat-calc.jpg", width: 1400, height: 818, alt: "약정 상세 화면 (가상 데이터): 기준 단가 10,000원, 11월 단가 10,320원, 지표 100→108과 산식" },
    example: [
      ["기준 단가", "10,000원"],
      ["제품당 원재료비", "4,000원"],
      ["원재료 지표", "100 → 108 (+8%, 요건 ±5% 충족)"],
      ["산식", "10,000 + 4,000 × (108 − 100) ÷ 100"],
      ["11월 조정단가", "10,320원 · 1,000개 기준 +320,000원"],
    ],
    points: [
      { title: "약정서에서 값을 찾아 원문과 함께", body: "AI가 기준 단가·원재료비·지표 같은 값을 찾고, 약정서 몇 쪽 어느 조항에서 찾았는지 같이 보여 줍니다. 담당자가 원문과 같다고 확인한 값만 계산에 씁니다." },
      { title: "계산은 정해진 산식으로만", body: "요건을 넘을 때만 산식대로 조정하고, 넘지 않으면 기준 단가를 유지합니다. 인상도 인하도 똑같이 계산합니다." },
      { title: "근거가 남는 계산", body: "지표 출처·관측일·산식·적용일을 계산 결과와 함께 남겨, 구매기업과 공급기업이 같은 결과를 확인합니다." },
    ],
  },
  {
    id: "recon",
    label: "반영 대조",
    summary: "발주서에 빠진 단가를 찾아냅니다",
    titleHtml: "계산한 단가가 <em>발주서에 들어갔는지</em> 확인합니다",
    lead: "ERP에서 내려받은 발주·청구 파일과 비교해, 이전 단가로 남은 거래를 찾아 처리할 업무로 올려 드립니다.",
    shot: { src: "./feat-recon.jpg", width: 1400, height: 697, alt: "처리할 업무 화면 (가상 데이터): 10,320원 계산 / 11월 발주 10,000원, +320,000원 미반영" },
    points: [
      { title: "ERP는 그대로", body: "쓰시던 프로그램에서 엑셀·CSV로 내려받은 발주 파일이면 됩니다. 열 이름은 처음 한 번만 맞춥니다." },
      { title: "계산·발주·청구·지급근거를 따로", body: "수정 요청을 보냈다고 완료로 바꾸지 않습니다. 발주, 청구, 지급근거마다 실제로 맞는지 확인될 때 완료합니다." },
      { title: "차액과 기한을 한눈에", body: "어느 발주가 얼마나 덜 반영됐는지(예: +320,000원)와 언제부터 적용해야 하는지(예: 12월 1일 검수분)를 함께 보여 줍니다." },
    ],
  },
  {
    id: "share",
    label: "자료 공유",
    summary: "정한 범위에서만 자료를 주고받습니다",
    titleHtml: "필요한 자료만, <em>정한 범위에서</em> 주고받습니다",
    lead: "어떤 항목이 왜, 언제까지, 누구에게 필요한지 정해서 요청합니다. 이메일과 엑셀로 같은 자료를 다시 모으지 않아도 됩니다.",
    shot: { src: "./feat-share.jpg", width: 1400, height: 526, alt: "공급사 자료 요청 화면 (가상 데이터): 요청 항목, 공급사, 기간, 상태" },
    points: [
      { title: "항목·이유·기간·받는 사람", body: "요청마다 무엇이 왜 필요한지, 어느 기간 자료인지, 누가 보는지를 함께 적습니다. 공급기업은 범위를 보고 승인합니다." },
      { title: "한 번 낸 자료는 다시 쓰기", body: "공급기업이 승인하면 지난번에 낸 확인서를 다시 씁니다. 같은 자료를 매번 새로 요청하지 않습니다." },
      { title: "누가 봤는지 남습니다", body: "자료를 누가 언제 열람했는지 이력이 남고, 권한 없는 열람 시도는 막습니다." },
    ],
  },
  {
    id: "security",
    label: "보안·권한",
    summary: "원가 원문 보호와 확인 이력",
    titleHtml: "원가 원문은 <em>공급기업이 정한 만큼만</em>",
    lead: "구매기업과 공급기업이 같은 계산 결과를 보되, 공급기업의 원가 원문은 기본적으로 공개하지 않도록 설계합니다.",
    points: [
      { title: "원문은 기본 비공개", body: "매입처·상세 단가 같은 원가 원문은 공급기업만 봅니다. 구매기업 화면에는 두 회사가 합의한 숫자만 나옵니다." },
      { title: "공개 범위는 공급기업이 승인", body: "구매기업이 요청해도 공급기업이 승인한 항목과 기간만 열립니다. 서비스 운영자도 원문을 기본으로 볼 수 없습니다." },
      { title: "AI가 금액을 정하지 않습니다", body: "AI는 문서에서 값을 찾는 데만 쓰고, 금액은 합의한 산식이 계산합니다. 외부 AI에는 승인 없이 고객 자료를 보내지 않습니다." },
      { title: "모든 확인·변경 이력 보관", body: "누가, 언제, 무엇을 확인하고 바꿨는지 남겨 나중에 근거로 쓸 수 있습니다." },
    ],
    note: "지금 공개된 화면은 가상 데이터로 만든 데모입니다. 실제 서비스에서는 서버 인증과 권한 검사로 보호합니다.",
  },
];

export const isFeatureId = (v: string | null): v is FeatureId => FEATURES.some((f) => f.id === v);
