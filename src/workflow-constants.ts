/** AL-004 가상 거래의 계산·검증 기준입니다. 기존 값과 동작을 유지합니다. */
export const MATERIAL_UNIT_PRICE_WON_PER_KG = 2800;
export const SOURCE_QUANTITY_KG = 4;
export const BASE_DELIVERY_PRICE_WON = 22000;
export const INITIAL_MATERIAL_COST_WON = SOURCE_QUANTITY_KG * MATERIAL_UNIT_PRICE_WON_PER_KG;
export const RETURN_NOTE_MAX_LENGTH = 300;
/** 증빙 처리 순서입니다. 브라우저에 저장된 기존 숫자를 유지합니다. */
export const EVIDENCE_STAGE = { pendingPo: 0, pendingInvoice: 1, pendingPayment: 2, complete: 3 } as const;
