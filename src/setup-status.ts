export const setupStatus = (): string => {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem("faccon-setup-meta") ?? "null");
    if (typeof raw !== "object" || raw === null || !("invite" in raw) || !("erp" in raw)) return `<p class="notice-bar">가상 6개 계약을 둘러보고 있습니다. <a href="./start.html">도입 설정 시작</a> · <a href="./app.html?role=buyer#/review">AL-004 양사 처리 체험</a></p>`;
    const pending = [raw.invite ? "" : "공급기업 초대", raw.erp ? "" : "ERP 파일 연결"].filter(Boolean).join(" · ");
    return `<p class="notice-bar">${pending ? `남은 도입 설정: ${pending}.` : "도입 설정 체험을 마쳤습니다."} 아래는 설정 여부와 별개인 샘플 계약입니다. <a href="./start.html">설정 다시 확인</a></p>`;
  } catch { return ""; }
};
