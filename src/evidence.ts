import { activeSupplier } from "./context";
import { adjust, signedWon, won } from "./calc";
import { demoContracts, demoRows } from "./demo";
import { esc, supplierName } from "./ui";
import type { Contract, Role } from "./types";


export const evidenceRows = (role: Role): readonly (readonly string[])[] => demoContracts()
  .filter((c: Contract): boolean => role === "buyer" || c.supplier === activeSupplier())
  .map((c: Contract): readonly string[] => {
    const r = adjust(c);
    const row = demoRows().find((item): boolean => item.contract === c.id);
    const active = c.status === "ok";
    return [c.id, supplierName(c.supplier), c.version,
      c.status === "draft" ? "초안·미확정" : c.status === "renew" ? "종료·갱신 검토" : c.status === "nolink" ? "미연동 합의" : "운영 중 (가상)",
      active ? won(r.price) : "확정 산출 제외", active ? signedWon(r.total) : "집계 제외",
      row ? won(row.poPrice) : "미등록", row ? won(row.invPrice) : "미등록",
      row?.paid ? "가상 지급근거 확인" : "미확인",
      `${c.id} 약정 ${c.version} / p.2~3 (가상 출처)`];
  });
const HEADERS = ["계약", "공급기업", "버전", "약정 상태", "계산단가", "계산 차액", "발주단가", "청구단가", "지급근거", "출처 색인"];

export const evidenceView = (role: Role): string => {
  const rows = evidenceRows(role);
  return `<section class="card evidence-print"><div class="between"><div><h2>거래 증빙 요약 · 2026년 11월</h2><p>가상 자료 / 검토용 초안 · ${rows.length}개 등록 계약 기준</p></div><div class="row no-print"><button class="btn" data-export-csv>CSV 다운로드</button><button class="btn pri" data-print>인쇄 / PDF 저장</button></div></div>
    <div class="tbl"><table><thead><tr>${HEADERS.map((h: string): string => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row: readonly string[]): string => `<tr>${row.map((v: string): string => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <p class="note">계산 차액은 지급 실적이 아닙니다. 초안·종료 약정은 확정 계산 집계에서 제외합니다. 발주·청구 일치와 지급근거를 각각 확인합니다.</p>
    <h2>함께 확인할 자료</h2><ol><li>해당 버전의 약정서와 양사 승인 근거</li><li>기준·비교 지표의 출처 및 관측일, 산출 변동표</li><li>발주서·청구서·지급명세와 공유 승인 범위</li></ol>
    <p>이 출력에는 위 원문 파일이 첨부되지 않습니다. 실제 제출 전에는 기관별 최신 서식과 필수 자료를 확인하고, 제출 권한을 받은 원문을 별도로 첨부해야 합니다. 기관 인증·실적 인정·블록체인 검증을 완료한 문서가 아닙니다.</p></section>`;
};

/** CSV를 스프레드시트에서 열 때 수식으로 해석되지 않도록 텍스트를 보호한다. */
export const csvCell = (value: string): string => `"${(/^[=+@\-]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
export const downloadEvidence = (role: Role): void => {
  const csv = [HEADERS, ...evidenceRows(role)].map((row: readonly string[]): string => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = `단가조정_가상증빙요약_${role}_2026-11.csv`;
  a.click();
  const REVOKE_DELAY_MS = 1000;
  window.setTimeout((): void => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
};
