/* 상담 입력 검증과 브라우저 저장 형식. */
export interface ConsultDraft {
  readonly company: string;
  readonly name: string;
  readonly contact: string;
  readonly item: string;
  readonly message: string;
  readonly agreedAt: string;
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
const MAX_COMPANY = 100;
const MAX_NAME = 60;
const MAX_CONTACT = 150;
const MAX_ITEM = 150;
const MAX_MESSAGE = 2000;

export const problemOf = (draft: Readonly<ConsultDraft>, agreed: boolean): string | null => {
  if (!draft.company.trim() || draft.company.length > MAX_COMPANY) return "기업명을 100자 이내로 입력해 주십시오.";
  if (!draft.name.trim() || draft.name.length > MAX_NAME) return "담당자명을 60자 이내로 입력해 주십시오.";
  if (draft.contact.length > MAX_CONTACT || (!PHONE_RE.test(draft.contact.replace(/\s/g, "")) && !EMAIL_RE.test(draft.contact))) return "올바른 이메일 또는 휴대폰 번호를 입력해 주십시오.";
  if (draft.item.length > MAX_ITEM || draft.message.length > MAX_MESSAGE) return "품목은 150자, 상담 내용은 2,000자 이내로 입력해 주십시오.";
  if (!agreed) return "상담 내용의 저장 범위를 확인해 주십시오.";
  return null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
export const parseConsult = (value: unknown): ConsultDraft | null => {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isRecord(value.draft)) return null;
  const draft = value.draft;
  if (typeof draft.company !== "string" || typeof draft.name !== "string" || typeof draft.contact !== "string" || typeof draft.item !== "string" || typeof draft.message !== "string" || typeof draft.agreedAt !== "string") return null;
  const parsed: ConsultDraft = { company: draft.company, name: draft.name, contact: draft.contact, item: draft.item, message: draft.message, agreedAt: draft.agreedAt };
  return problemOf(parsed, true) === null && Number.isFinite(Date.parse(parsed.agreedAt)) ? parsed : null;
};
