/* 이용 가이드와 실제 구현 범위를 설명하는 질문 목록. */
import "../site/site.css";
import "../home/home.css";
import { mountSiteChrome } from "../shared/site-chrome";
import "./guide.css";
import { esc } from "../ui";

type Category = "workflow" | "data" | "start";
type Filter = Category | "all";
interface Faq { readonly category: Category; readonly q: string; readonly a: string }
interface CategoryChoice { readonly id: Filter; readonly label: string }
const CATEGORIES: readonly CategoryChoice[] = [
  { id: "all", label: "전체" }, { id: "workflow", label: "업무 진행" }, { id: "data", label: "자료 관리" }, { id: "start", label: "도입·이용" },
];
const FAQS: readonly Faq[] = [
  { category: "workflow", q: "이미 체결한 연동약정도 등록할 수 있습니까?", a: "새로운 거래 등록에서 기존 약정 등록을 선택합니다. 체결한 약정의 기준값·지표·산식·주기를 입력하고 두 기업이 확인한 뒤 조정 업무를 이어갑니다." },
  { category: "workflow", q: "AI가 금액이나 연동 대상 여부를 결정합니까?", a: "현재 화면의 단가 계산은 입력한 기준값과 정해진 산식으로 실행합니다. AI 추출과 법령 검토는 아직 연결되지 않았습니다. 등록한 값을 담당자가 확인하고 양사가 약정 조건을 승인합니다." },
  { category: "workflow", q: "정기적으로 단가를 계산할 때마다 양사가 다시 승인해야 합니까?", a: "최초 약정 조건은 양사가 승인합니다. 이후 그 산식으로 하는 정기 계산은 추가 재승인 없이 ERP 반영용 CSV와 청구 제출로 이어집니다. 계산 결과 확인은 선택적 기록이며, 청구정보는 수탁기업이 제출하고 위탁기업이 발주단가와 대조합니다." },
  { category: "workflow", q: "납품일과 검수일 중 어느 날짜를 적용합니까?", a: "일률적으로 정하지 않습니다. 거래 등록 시 약정에 적힌 적용 기준을 선택합니다. 이후 반영 확인에서도 그 날짜와 조정단가 반영일을 비교합니다." },
  { category: "workflow", q: "등록 후 수탁기업 화면에는 어떻게 나타납니까?", a: "같은 브라우저에서 탭을 두 개 열고 각각 위탁기업과 수탁기업으로 로그인합니다. 등록한 거래의 수탁기업명과 같은 회사명을 사용하면 해당 거래를 확인할 수 있습니다. 다른 기기와 자동 공유되지는 않습니다." },
  { category: "data", q: "어떤 자료를 등록할 수 있습니까?", a: "계약서·연동약정서, 세금계산서, 소요량 산출표, 매입증빙, 원가 검토 결과 등 자료 종류를 선택합니다. 파일당 10MB 이하의 PDF·이미지·엑셀·워드·한글·CSV·TXT 파일을 보관할 수 있습니다. 원재료비 검토를 실행하면 지원하는 두 엑셀 양식의 셀을 읽습니다. 세금계산서 PDF의 공급가액은 담당자가 확인해 입력합니다." },
  { category: "data", q: "회사 내부 자료가 상대 기업 화면에 표시됩니까?", a: "회사 내부 보관으로 등록한 파일은 상대 기업의 자료 목록에서 제외됩니다. 상대 기업에도 공유로 선택한 자료만 공동으로 확인합니다. 현재는 브라우저 안의 화면 권한 구분이며, 실제 기업 데이터를 위한 서버 인증·보안 체계는 도입 시 별도로 검증해야 합니다." },
  { category: "data", q: "증빙 목록을 내려받으면 정부기관 제출까지 끝납니까?", a: "아닙니다. 내려받은 파일은 약정·조정·승인·반영 이력을 모은 업무 자료입니다. 제출처가 요구하는 서류를 확인하고 원문과 함께 준비해야 하며, 현재 서비스에서 정부기관으로 전송하지 않습니다." },
  { category: "start", q: "기존 ERP를 바꿔야 합니까?", a: "현재 업무 흐름은 기존 시스템을 유지하는 방식입니다. 확정한 단가와 적용 기준을 CSV로 내려받아 담당자가 반영하고, 그 결과를 이 화면에서 확인합니다. ERP에 직접 쓰는 API는 연결되어 있지 않습니다." },
  { category: "start", q: "서비스 도입과 비용은 어떻게 확인합니까?", a: "도입 상담에서 거래 수, 자료 형식, 필요한 기능과 운영 환경을 확인한 뒤 적용 범위를 정합니다. 현재 상담 화면은 작성 내용을 이 브라우저에 저장하고 파일로 내려받는 방식입니다." },
];
let current: Filter = "all";
const render = (): void => {
  const tabs = document.getElementById("faq-tabs");
  const list = document.getElementById("faq-list");
  if (!tabs || !list) return;
  tabs.innerHTML = CATEGORIES.map((choice: CategoryChoice): string => `<button type="button" aria-pressed="${choice.id === current}" data-cat="${esc(choice.id)}">${esc(choice.label)}</button>`).join("");
  const shown = FAQS.filter((item: Faq): boolean => current === "all" || item.category === current);
  list.innerHTML = shown.map((item: Faq): string => `<details class="faq-item"><summary><span class="q-mark" aria-hidden="true">Q</span><span class="q-text">${esc(item.q)}</span></summary><div class="answer"><p>${esc(item.a)}</p></div></details>`).join("");
};
const isCategory = (value: string | undefined): value is Filter => CATEGORIES.some((choice: CategoryChoice): boolean => choice.id === value);
document.getElementById("faq-tabs")?.addEventListener("click", (event: MouseEvent): void => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("[data-cat]") : null;
  if (!button || !isCategory(button.dataset.cat)) return;
  current = button.dataset.cat;
  render();
  document.querySelector<HTMLButtonElement>(`[data-cat='${current}']`)?.focus();
});
render();

mountSiteChrome();
