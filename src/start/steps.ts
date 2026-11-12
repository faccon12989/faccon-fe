/* 단계별 화면. 모든 사용자 입력은 esc로 이스케이프해서 넣는다. */
import { esc } from "../ui";
import {
  ALERT_CHANNELS, AUTO_MAPPING, B_CHECKLIST, CSV_COLUMNS, ERP_FIELDS, type StartState,
} from "./model";

const field = (name: string, label: string, value: string, opts: { type?: string; hint?: string; required?: boolean; ac?: string } = {}): string => `
  <label class="fld"><span class="fld-l">${label}${opts.required ? ' <span class="req">필수</span>' : ""}</span>
    <input name="${name}" type="${opts.type ?? "text"}" value="${esc(value)}" ${opts.ac ? `autocomplete="${opts.ac}"` : ""}>
    ${opts.hint ? `<small>${opts.hint}</small>` : ""}
  </label>`;

const stepPath = (s: StartState): string => {
  const card = (v: "A" | "B", title: string, desc: string, first: string): string => `
    <label class="choice ${s.path === v ? "on" : ""}">
      <input type="radio" name="path" value="${v}" ${s.path === v ? "checked" : ""}>
      <b>${title}</b><span>${desc}</span>
      <small>첫 결과: ${first}</small>
    </label>`;
  return `
    <h1>어디서 시작할까요?</h1>
    <p class="lead-s">이미 맺은 약정이 있으면 원가를 다시 낼 필요 없이 바로 운영을 시작합니다.</p>
    <div class="choices">
      ${card("A", "기존 약정이 있어요", "서명된 약정서, 전문기관 확인서, 지표·산식을 가져와 매달 운영합니다.", "조건 확인 후 바로 모니터링")}
      ${card("B", "새로 약정을 준비해요", "대상 확인부터 원가자료 정리, 산정 초안, 필요하면 전문 검토까지 돕습니다.", "산정 초안 → 필요시 전문 검토 → 약정")}
    </div>
    <details class="pre-check"><summary>우리 거래가 연동 대상인지 모르겠어요</summary>
      <p>주요 원재료(비용이 납품대금의 10% 이상)가 있는지, 위탁기업이 소기업이거나 90일 이내·1억 원 이하 거래인지에 따라 달라집니다. 여기서 결론 내리지 않고, 시작 후 거래별로 근거와 함께 “대상 / 예외 / 추가 확인”으로 분류합니다.</p>
    </details>`;
};

const stepCompany = (s: StartState): string => {
  return `
    <h1>회사와 담당자를 알려주세요</h1>
    <p class="lead-s">파일럿은 한 품목군에서 시작합니다. 결재하실 분이 따로 있으면 함께 적어 주세요.</p>
    <div class="grid2">
      ${field("company", "회사명", s.company, { required: true, ac: "organization" })}
      ${field("category", "시작할 품목군", s.category, { hint: "예: 알루미늄 가공품" })}
      ${field("manager", "구매 담당자", s.manager, { required: true, ac: "name" })}
      ${field("email", "담당자 이메일", s.email, { type: "email", required: true, ac: "email" })}
      ${field("approver", "예산 승인자 (선택)", s.approver, { hint: "결과를 확정하는 분 · 도입 결정에도 참여" })}
      ${field("phone", "휴대폰 (선택)", s.phone, { type: "tel", hint: "알림톡·문자를 받을 번호", ac: "tel" })}
    </div>
    <fieldset class="notify"><legend>알림 받을 곳</legend>
      <div class="chan-pick">${ALERT_CHANNELS.map((ch) => `<label><input type="checkbox" name="channel" value="${ch.id}" ${s.channels.includes(ch.id) ? "checked" : ""}> ${ch.label}</label>`).join("")}</div>
    </fieldset>`;
};

const stepUploadA = (s: StartState): string => {
  if (!s.uploaded) {
    return `
      <h1>기존 약정을 가져옵니다</h1>
      <p class="lead-s">약정서와 확인서를 올리면 조건을 찾아 원문 위치와 함께 보여드립니다. 확정은 담당자가 합니다.</p>
      <button type="button" class="drop" id="mock-upload">
        <b>약정서·확인서 파일 선택</b><span>PDF, HWP, 엑셀 · 데모에서는 가상 파일이 올라갑니다</span>
      </button>
      <p class="hint-s">원가 원문을 다시 낼 필요는 없습니다. 지표·산식·적용일이 불분명한 항목만 나중에 보완합니다.</p>`;
  }
  const rows = s.extracted.map((x) => {
    const low = x.confidence < 0.8;
    return `<tr class="${low ? "low" : ""}">
      <td><b>${esc(x.label)}</b></td><td>${esc(x.value)}</td>
      <td><span class="src">${esc(x.source)}</span></td>
      <td>${low ? '<span class="badge warn">다시 확인</span>' : `<span class="badge">${Math.round(x.confidence * 100)}%</span>`}</td>
      <td><label class="ck"><input type="checkbox" name="confirm" value="${esc(x.key)}" ${x.confirmed ? "checked" : ""}> 원문과 같음</label></td></tr>`;
  }).join("");
  return `
    <h1>뽑아낸 조건을 확인해 주세요</h1>
    <p class="lead-s"><b>약정서_AL-001_v1.1.pdf</b>, <b>비중확인서_2026.pdf</b>에서 찾은 값입니다 (가상).</p>
    <div class="tbl-s"><table>
      <thead><tr><th>항목</th><th>찾은 값</th><th>원문 위치</th><th>신뢰도</th><th>확인</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
    <button type="button" class="btn ghost sm" id="confirm-all">모두 원문과 같음으로 표시</button>
    <p class="hint-s">AI가 찾은 값은 초안입니다. 금액 계산은 확인된 값으로 고정된 규칙이 합니다. “다시 확인” 항목은 필요하면 공급기업에 그 항목만 보완 요청합니다.</p>`;
};

const stepUploadB = (s: StartState): string => {
  const items = B_CHECKLIST.map((c) => `<label class="ck row-ck"><input type="checkbox" name="checklist" value="${esc(c)}" ${s.checklist.includes(c) ? "checked" : ""}> ${esc(c)}</label>`).join("");
  return `
    <h1>지금 준비할 수 있는 자료를 골라 주세요</h1>
    <p class="lead-s">없는 자료는 비워 두세요. 빠진 항목만 공급기업에 이유와 기간을 밝혀 요청합니다.</p>
    <div class="check-list">${items}</div>
    <p class="hint-s">원가 비중·지표·산식 확인이 어려우면 전문기관 검토로 연결합니다. 전문기관 명의 확인서는 그 기관이 발급합니다.</p>`;
};

const stepInvite = (s: StartState): string => {
  const rows = s.invites.map((inv, i) => `
    <div class="invite">
      <input name="inv-company-${i}" placeholder="공급기업 회사명" value="${esc(inv.company)}" aria-label="공급기업 회사명 ${i + 1}">
      <input name="inv-email-${i}" type="email" placeholder="담당자 이메일" value="${esc(inv.email)}" aria-label="공급기업 이메일 ${i + 1}">
    </div>`).join("");
  return `
    <h1>공급기업을 초대합니다</h1>
    <p class="lead-s">공급기업 참여는 무료입니다. 자기 거래의 계산 결과와 반영 상태를 같이 봅니다.</p>
    ${rows}
    <button type="button" class="btn ghost sm" id="add-invite">+ 공급기업 추가</button>
    <fieldset class="scope"><legend>공급기업에게 받을 범위</legend>
      <label class="ck row-ck"><input type="radio" name="scope" value="result" ${s.shareScope === "result" ? "checked" : ""}> 양사 합의한 산정 결과만 <small>(권장)</small></label>
      <label class="ck row-ck"><input type="radio" name="scope" value="result+summary" ${s.shareScope === "result+summary" ? "checked" : ""}> 산정 결과 + 요약 근거</label>
      <p class="lock-s">🔒 상세 매입자료 원문은 어떤 경우에도 기본 비공개입니다. 미연동 동의나 포괄적 정보공유는 미리 체크해 두지 않습니다.</p>
    </fieldset>`;
};

const stepErp = (s: StartState): string => {
  if (!s.erpUploaded) {
    return `
      <h1>ERP 발주·청구 파일을 연결합니다</h1>
      <p class="lead-s">ERP는 바꾸지 않습니다. 발주·청구 내역 파일을 내려받아 올리면, 계산단가와 다른 건을 찾습니다.</p>
      <button type="button" class="drop" id="mock-erp"><b>발주 파일 선택</b><span>CSV·엑셀 · 데모에서는 PO_2026-11.csv가 올라갑니다</span></button>
      <button type="button" class="btn ghost sm" id="skip-erp">나중에 연결</button>`;
  }
  const rows = ERP_FIELDS.map((f) => `
    <tr><td><b>${f}</b></td><td>
      <select name="map-${f}" aria-label="${f}에 맞는 열">
        <option value="">열 선택</option>
        ${CSV_COLUMNS.map((c) => `<option ${s.mapping[f] === c ? "selected" : ""}>${c}</option>`).join("")}
      </select></td>
      <td>${s.mapping[f] === AUTO_MAPPING[f] ? '<span class="badge">자동 추천</span>' : ""}</td></tr>`).join("");
  return `
    <h1>열 이름을 한 번만 맞춰 주세요</h1>
    <p class="lead-s"><b>PO_2026-11.csv</b> · 1,284행 (가상). 이 설정은 저장되어 다음 달부터는 파일만 올리면 됩니다.</p>
    <div class="tbl-s"><table><thead><tr><th>필요한 항목</th><th>파일의 열</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
};

const stepReview = (s: StartState): string => {
  const invites = s.invites.filter((i) => i.company.trim()).map((i) => esc(i.company)).join(", ") || "-";
  const plan = [
    ["1주", "실제 절차 재현 · 정답셋 만들기"],
    ["2~3주", s.path === "A" ? "기존 약정 1건 전 과정 운영" : "산정 초안 · 필요시 전문 검토"],
    ["4~5주", "반영 대조 · 목적별 제출자료"],
    ["6주", "도입 전후 시간 비교 · 계속/축소/전환 결정"],
  ].map(([w, t]) => `<li><b>${w}</b>${t}</li>`).join("");
  return `
    <h1>이렇게 시작합니다</h1>
    <dl class="summary">
      <dt>시작 방식</dt><dd>${s.path === "A" ? "A. 기존 약정 운영" : "B. 신규 약정 준비"}</dd>
      <dt>회사 · 담당자</dt><dd>${esc(s.company)} · ${esc(s.manager)}</dd>
      <dt>품목군</dt><dd>${esc(s.category) || "-"}</dd>
      <dt>공급기업</dt><dd>${invites} · ${s.shareScope === "result" ? "산정 결과만" : "결과 + 요약 근거"}</dd>
      <dt>알림</dt><dd>${ALERT_CHANNELS.filter((ch) => s.channels.includes(ch.id)).map((ch) => ch.label).join(", ") || "받지 않음"}</dd>
      <dt>ERP 파일</dt><dd>${s.erpUploaded ? "발주 파일 연결 · 열 매핑 저장" : "나중에 연결"}</dd>
    </dl>
    <h2 class="h2-s">6주 파일럿 일정</h2>
    <ol class="plan-s">${plan}</ol>
    <label class="ck row-ck consent"><input type="checkbox" name="consent" ${s.measureConsent ? "checked" : ""}> 같은 업무를 기존 방식과 이 서비스로 각각 해보고 걸린 시간을 기록하는 데 동의합니다. <small>가격은 이 측정 결과를 보고 제안합니다.</small></label>`;
};

export const renderStep = (s: StartState): string => {
  switch (s.step) {
    case 0: return stepPath(s);
    case 1: return stepCompany(s);
    case 2: return s.path === "B" ? stepUploadB(s) : stepUploadA(s);
    case 3: return stepInvite(s);
    case 4: return stepErp(s);
    default: return stepReview(s);
  }
};

export const renderDone = (s: StartState): string => {
  return `
    <div class="done">
      <h1>${esc(s.company)}의 파일럿을 준비했습니다</h1>
      <p class="lead-s">공급기업 초대 메일이 발송되고, 담당 매니저가 1주차 업무 재현 일정을 잡기 위해 연락드립니다 (데모 — 실제 발송 없음).</p>
      <div class="row"><a class="btn solid" href="./my.html">기업 대시보드 열기 →</a><a class="btn ghost" href="./">소개로 돌아가기</a></div>

    </div>`;
};
