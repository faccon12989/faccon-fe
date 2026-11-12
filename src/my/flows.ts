/* 할 일 해결 과정. 각 할 일은 몇 단계의 안내 화면으로 처리한다. */
import { adjust, won } from "../calc";
import type { Contract } from "../types";
import { applyFrom, esc, findContract } from "../ui";

export type TaskId = "C-101" | "C-102" | "C-103";

export interface FlowStep {
  title: string;
  body: string;
  /** 다음으로 넘어가는 버튼 문구 */
  cta: string;
}

const contractOf = (id: string): Contract => {
  const c = findContract(id);
  if (!c) throw new Error(`${id} 계약이 없습니다`);
  return c;
};

const unappliedFlow = (): FlowStep[] => {
  const c = contractOf("AL-001");
  const r = adjust(c);
  const gap = (r.price - 10000) * c.qty;
  return [
    {
      title: "발주에 이전 단가가 남아 있습니다",
      body: `<div class="cmp-box">
          <div><small>약정대로 계산한 단가</small><b>${won(r.price)}</b></div>
          <div class="vs">≠</div>
          <div><small>11월 발주 PO-2611-014</small><b class="strike">${won(10000)}</b></div>
        </div>
        <p class="why"><b>바뀐 이유</b> 알루미늄 지수가 100에서 108로 8% 올라 약정 요건(±5%)을 넘었습니다. 약정 산식대로 원재료비 4,000원의 8%인 320원이 올라갑니다.</p>
        <p class="impact">그대로 두면 1,000개 기준 <b>${won(gap)}</b>이 반영되지 않습니다.</p>`,
      cta: "고칠 내용 확인",
    },
    {
      title: "발주 단가 수정을 요청합니다",
      body: `<ul class="todo-list">
          <li><span>대상</span><b>PO-2611-014 · ${esc(c.item)}</b></li>
          <li><span>변경</span><b>${won(10000)} → ${won(r.price)}</b></li>
          <li><span>적용 시점</span><b>${esc(applyFrom(c.applyDay))}</b></li>
          <li><span>근거</span><b>변동표 11월 · 약정 ${esc(c.version)} 제5조</b></li>
        </ul>
        <label class="pick">받는 사람
          <select name="to"><option>ERP 담당 박OO (구매팀)</option><option>회계팀 이OO</option></select></label>
        <p class="note-s">약정 문구는 '${esc(c.applyDay)}'라서, 11월 발주 중 12월 1일 이후 검수되는 물량부터 새 단가가 적용됩니다. 공급기업에도 같은 변동표가 공유되고, 원가 원문은 포함되지 않습니다.</p>`,
      cta: "수정 요청 보내기",
    },
    {
      title: "요청을 보냈습니다",
      body: `<div class="ok-box"><span aria-hidden="true">✓</span><p>ERP에 반영되면 다음 발주 파일을 올릴 때 자동으로 다시 대조합니다. 일치하면 이 업무는 자동으로 완료됩니다.</p></div>
        <ol class="mini-track"><li class="on">산출</li><li class="now">발주 반영 요청</li><li>청구</li><li>지급근거</li></ol>`,
      cta: "완료",
    },
  ];
};

const renewFlow = (): FlowStep[] => {
  const c = contractOf("ST-005");
  return [
    {
      title: "계약 종료 후에도 발주가 계속되고 있습니다",
      body: `<ul class="todo-list">
          <li><span>계약</span><b>${esc(c.id)} · ${esc(c.item)}</b></li>
          <li><span>계약 종료일</span><b>${esc(c.end)}</b></li>
          <li><span>종료 후 발주</span><b>2건 (11/04, 11/18)</b></li>
        </ul>
        <p class="why">위반이 확정된 것은 아닙니다. 계약을 연장했다면 연동약정도 함께 갱신됐는지 확인해 주십시오.</p>`,
      cta: "다음",
    },
    {
      title: "현재 상황을 선택해 주십시오",
      body: `<div class="opt-list">
          <label><input type="radio" name="renew" value="extend" checked> 계약을 연장했습니다 <small>약정 갱신본을 같이 올리거나, 공급기업에 서명 요청을 보냅니다</small></label>
          <label><input type="radio" name="renew" value="end"> 거래를 종료했습니다 <small>남은 발주 2건만 정리하고 약정을 종료로 표시합니다</small></label>
          <label><input type="radio" name="renew" value="check"> 확인이 필요합니다 <small>계약 담당자에게 확인 요청을 보냅니다</small></label>
        </div>`,
      cta: "이대로 진행",
    },
    {
      title: "갱신 확인을 시작했습니다",
      body: `<div class="ok-box"><span aria-hidden="true">✓</span><p>영남프레스에 약정 갱신 서명 요청을 보냈습니다 (데모). 서명이 끝나면 버전 기록에 v1.1로 남습니다.</p></div>`,
      cta: "완료",
    },
  ];
};

const missingFlow = (): FlowStep[] => {
  return [
    {
      title: "산정에 필요한 값 하나가 비어 있습니다",
      body: `<ul class="todo-list">
          <li><span>약정</span><b>AL-004 다이캐스팅 하우징 (준비 중)</b></li>
          <li><span>빠진 값</span><b>제품당 알루미늄 투입량 (kg/개)</b></li>
          <li><span>이유</span><b>주요 원재료 비중 10% 판단에 필요</b></li>
        </ul>
        <p class="why">전체 원가 자료를 다시 받지 않고 <b>이 값 하나만</b> 요청합니다.</p>`,
      cta: "요청 내용 만들기",
    },
    {
      title: "공급기업에 보낼 요청",
      body: `<div class="req-card">
          <p><b>받는 곳</b> 대구캐스팅 (가상) 생산팀</p>
          <p><b>항목</b> 제품당 알루미늄 투입량 (kg/개)</p>
          <p><b>기간</b> 2026.08 ~ 2026.10 평균</p>
          <p><b>열람 범위</b> 양사 공유 결과만 · 원문은 공급기업 전용</p>
          <label class="pick">회신 기한<select name="due"><option>7일</option><option>14일</option></select></label>
        </div>`,
      cta: "요청 보내기",
    },
    {
      title: "요청을 보냈습니다",
      body: `<div class="ok-box"><span aria-hidden="true">✓</span><p>공급기업이 값을 올리면 알려 드립니다. 원문 열람 기록은 공급기업도 볼 수 있습니다.</p></div>`,
      cta: "완료",
    },
  ];
};

export const flowFor = (id: TaskId): FlowStep[] => {
  if (id === "C-101") return renewFlow();
  if (id === "C-102") return unappliedFlow();
  return missingFlow();
};
