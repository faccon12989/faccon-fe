import { describe, expect, it } from "vitest";
import { parseConsult, problemOf, type ConsultDraft } from "./model";

const VALID: ConsultDraft = { company: "샘플정밀", name: "담당자", contact: "contact@example.invalid", item: "알루미늄 부품", message: "약정 업무 상담", agreedAt: "2026-11-18T00:00:00.000Z" };
describe("상담 초안 검증", (): void => {
  it("필수 정보와 저장 동의가 있으면 유효합니다", (): void => {
    expect(problemOf(VALID, true)).toBeNull();
    expect(problemOf({ ...VALID, contact: "010 0000 0000" }, true)).toBeNull();
  });
  it("동의 누락·잘못된 연락처·공백 회사명을 거부합니다", (): void => {
    expect(problemOf(VALID, false)).not.toBeNull();
    expect(problemOf({ ...VALID, contact: "not-an-address" }, true)).not.toBeNull();
    expect(problemOf({ ...VALID, company: " " }, true)).not.toBeNull();
  });
  it("손상되거나 다른 버전의 브라우저 저장값을 복원하지 않습니다", (): void => {
    expect(parseConsult(null)).toBeNull();
    expect(parseConsult({ schemaVersion: 2, draft: VALID })).toBeNull();
    expect(parseConsult({ schemaVersion: 1, draft: { ...VALID, contact: 42 } })).toBeNull();
    expect(parseConsult({ schemaVersion: 1, draft: { ...VALID, agreedAt: "unknown" } })).toBeNull();
    expect(parseConsult({ schemaVersion: 1, draft: VALID })).toEqual(VALID);
  });
});
