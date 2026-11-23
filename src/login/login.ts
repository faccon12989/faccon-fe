import "../my/local.css";
import { mountSiteChrome } from "../shared/site-chrome";
import { companyNames, saveSession } from "../local-store";
import type { Role } from "../types";
import { esc } from "../ui";

const form = document.querySelector<HTMLFormElement>("#login-form");
const errorNode = document.getElementById("login-error");
const list = document.getElementById("companies");
const updateCompanies = (): void => {
  const role = document.querySelector<HTMLInputElement>('input[name="role"]:checked')?.value === "supplier" ? "supplier" : "buyer";
  try { if (list) list.innerHTML = companyNames(role).map((name: string): string => `<option value="${esc(name)}"></option>`).join(""); }
  catch (error: unknown) { if (errorNode) errorNode.textContent = error instanceof Error ? error.message : "저장된 자료를 확인하지 못했습니다."; }
};
form?.addEventListener("change", (event: Event): void => {
  if (event.target instanceof HTMLInputElement && event.target.name === "role") updateCompanies();
});
form?.addEventListener("submit", (event: SubmitEvent): void => {
  event.preventDefault();
  const data = new FormData(form);
  const company = String(data.get("company") ?? "").trim();
  const name = String(data.get("name") ?? "").trim();
  const role: Role = data.get("role") === "supplier" ? "supplier" : "buyer";
  if (!company || !name) { if (errorNode) errorNode.textContent = "회사명과 담당자명을 입력해 주세요."; return; }
  try {
    saveSession({ role, company, name });
    const next = new URLSearchParams(location.search).get("next");
    location.href = next === "start" && role === "buyer" ? "./start.html" : "./my.html#/home";
  } catch { if (errorNode) errorNode.textContent = "업무 공간을 열지 못했습니다. 브라우저 저장소 사용 설정을 확인해 주세요."; }
});
updateCompanies();

mountSiteChrome();
