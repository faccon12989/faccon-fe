/* 자주 묻는 질문: 분류 탭 + 누르면 펼쳐지는 질문 목록 */
import "../site/site.css";
import { esc } from "../ui";

type Category = "service" | "start" | "data";

interface Faq {
  category: Category;
  q: string;
  a: string;
}

const CATEGORIES: readonly Readonly<{ id: Category | "all"; label: string }>[] = [
  { id: "all", label: "전체" },
  { id: "service", label: "서비스" },
  { id: "start", label: "도입·비용" },
  { id: "data", label: "자료·보안" },
];

const FAQS: readonly Faq[] = [
  { category: "service", q: "정부 지원 없이 맺은 약정서도 사용할 수 있습니까?", a: "네. 두 회사가 직접 맺은 약정서도 그대로 올리시면 됩니다." },
  { category: "service", q: "금액은 누가 계산합니까?", a: "약정서에 적힌 계산식대로 프로그램이 계산합니다. AI는 약정서에서 숫자를 찾아 주는 데까지만 쓰고, 최종 확정은 회사 결재권자가 합니다." },
  { category: "service", q: "AI가 약정서를 잘못 읽으면 어떻게 됩니까?", a: "찾은 값마다 약정서의 어느 쪽, 어느 조항에서 찾았는지 같이 보여 드립니다. 담당자가 원문과 같은지 확인한 값만 계산에 씁니다." },
  { category: "service", q: "연동하지 않기로 한 거래도 관리합니까?", a: "네. 미연동 합의서와 그 사유를 같이 보관해 두고, 실태조사 때 따로 묶어 드립니다." },
  { category: "start", q: "ERP를 바꿔야 합니까?", a: "아닙니다. 쓰시던 프로그램에서 엑셀로 내려받은 발주 파일이면 됩니다." },
  { category: "start", q: "공급사도 비용을 냅니까?", a: "아닙니다. 이용료는 구매기업만 냅니다. 공급사는 무료로 자기 거래의 계산 결과와 반영 상태를 확인합니다." },
  { category: "data", q: "공급사 원가 자료가 우리 회사에 보입니까?", a: "원가 원문은 공급사만 봅니다. 구매기업 화면에는 두 회사가 합의한 숫자만 나옵니다." },
  { category: "data", q: "어떤 파일을 올릴 수 있습니까?", a: "약정서와 확인서는 PDF, HWP, 엑셀 파일을 올릴 수 있고, 발주 내역은 CSV나 엑셀 파일이면 됩니다." },
];

let current: Category | "all" = "all";

const render = (): void => {
  const tabs = document.getElementById("faq-tabs");
  const list = document.getElementById("faq-list");
  if (!tabs || !list) return;
  tabs.innerHTML = CATEGORIES.map((c) => {
    const on = c.id === current;
    return `<button type="button" role="tab" aria-selected="${on}" data-cat="${c.id}">${esc(c.label)}</button>`;
  }).join("");
  const shown = FAQS.filter((f) => current === "all" || f.category === current);
  list.innerHTML = shown.map((f) => `
    <details class="faq-item">
      <summary><span class="q-mark" aria-hidden="true">Q</span><span class="q-text">${esc(f.q)}</span></summary>
      <div class="answer"><span class="a-mark" aria-hidden="true">A</span><p>${esc(f.a)}</p></div>
    </details>`).join("");
};

const isCategory = (v: string | undefined): v is Category | "all" => CATEGORIES.some((c) => c.id === v);

document.getElementById("faq-tabs")?.addEventListener("click", (e) => {
  const btn = e.target instanceof Element ? e.target.closest<HTMLButtonElement>("[data-cat]") : null;
  if (!btn || !isCategory(btn.dataset.cat)) return;
  current = btn.dataset.cat;
  render();
});

render();
