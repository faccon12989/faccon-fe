import { won } from "../calc";
import { readLocalFile } from "../local-files";
import { calculateLocal } from "../local-workflow";
import type { LocalDocument, LocalSession, LocalTrade } from "../types";
import { esc } from "../ui";
import { readVisitSheet } from "./visit-sheet";

const own = (trade: LocalTrade, user: LocalSession, kind: string): readonly LocalDocument[] =>
  trade.documents.filter((d: LocalDocument): boolean => d.kind === kind && d.owner === user.company && d.scope === "private");
const selectDoc = (docs: readonly LocalDocument[], name: string, label: string): string =>
  `<label class="fd-field"><span>${esc(label)}</span><select name="${esc(name)}" required><option value="">자료 선택</option>${docs.map((d: LocalDocument): string => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join("")}</select></label>`;
export const visitPanel = (trade: LocalTrade, user: LocalSession): string => {
  const calc = user.role === "supplier" ? `<section class="fd-panel fd-action-panel fd-visit-panel"><h2>원재료비 검토</h2><p>회사 내부 보관으로 등록한 자료를 선택합니다. 시연 양식의 두 엑셀 파일을 읽고, 세금계산서에서 직접 확인한 공급가액과 대조합니다.</p>
  <form class="fd-form" data-form="visitReview">${selectDoc(own(trade,user,"소요량 산출표"),"bom","제품별 소요량 산출표 · XLSX")}${selectDoc(own(trade,user,"매입증빙"),"purchase","매입 거래명세서 · XLSX")}${selectDoc(own(trade,user,"세금계산서"),"tax","같은 거래의 세금계산서 · PDF")}
  <label class="fd-field"><span>세금계산서 원문에서 확인한 공급가액 (원, 부가세 제외)</span><input name="taxNet" type="number" required min="1" step="1"></label><button type="submit" class="fd-button">원문 대조·보고서 미리보기</button></form><div id="visit-review-output" aria-live="polite"></div></section>` : "";
  const change = trade.adjustment ? `<section class="fd-panel fd-action-panel fd-visit-panel"><h2>약정 서식 출력</h2><form class="fd-form" data-form="visitChange"><label class="fd-field"><span>약정에 따라 이번 단가를 조정한 날짜</span><input required type="date" name="adjusted"></label><button type="submit" class="fd-button">변동표 미리보기</button></form></section>` : "";
  return calc + change;
};
const pos = (x: number, y: number, text: string, size: number = 9, width: number = 180): string =>
  `<span style="position:absolute;left:${x/595*100}%;top:${(y-size)/841*100}%;width:${width/595*100}%;font-size:${size}pt;overflow-wrap:anywhere">${esc(text)}</span>`;
const page = (name: string, fields: string): string => `<section class="paper"><img alt="공개 원본 서식" style="position:absolute;width:100%;height:100%" src="${esc(new URL(`./visit-forms/${name}.png`, document.baseURI).href)}">${fields}</section>`;
const preview = (title: string, content: string): void => {
  const win = window.open("", "_blank");
  if (!win) throw new Error("미리보기 창을 열 수 있도록 이 사이트의 팝업을 허용해 주세요.");
  win.opener = null;
  win.document.write(`<!doctype html><html lang="ko"><meta charset="utf-8"><title>${esc(title)}</title><style>
  *{box-sizing:border-box}body{font:12pt 'Malgun Gothic',sans-serif;color:#19324b;margin:0;background:#e9eff4}nav{padding:15px;text-align:center}button{padding:9px 18px}.paper{position:relative;background:white center / 100% 100% no-repeat;width:210mm;height:297mm;margin:8px auto;break-after:page}.paper:last-child{break-after:auto}.text{padding:20mm}.text h1{font-size:22pt}.text p{line-height:1.65}.text dt{margin-top:18px;font-weight:bold}.text dd{margin:5px 0}.tag{font-size:10pt;color:#35658a}@page{size:A4;margin:0}@media print{body{background:white}nav{display:none}.paper{margin:0;print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style><nav><button id="print">인쇄 / PDF로 저장</button>　공개 서식 배경을 포함해 인쇄합니다.</nav>${content}</html>`);
  win.document.close();
  win.document.getElementById("print")?.addEventListener("click", (): void => win.print());
};
const integer = (value: string): number => Number(value.replaceAll(",", ""));
const textPage = (title: string, lines: readonly (readonly [string,string])[]): string =>
  `<section class="paper text"><p class="tag">FACCON · 기업방문 시연 · 미서명</p><h1>${esc(title)}</h1><dl>${lines.map(([k,v]: readonly [string,string]): string => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></section>`;
export const reviewVisit = async (trade: LocalTrade, user: LocalSession, data: FormData, output: HTMLElement): Promise<void> => {
  if (user.role !== "supplier" || trade.supplier !== user.company) throw new Error("수탁기업 내부 검토 화면에서 진행해 주세요.");
  const selected = (key: string, kind: string): LocalDocument => {
    const doc = own(trade, user, kind).find((d: LocalDocument): boolean => d.id === data.get(key));
    if (!doc) throw new Error("현재 거래에서 사용할 내부 보관 자료를 선택해 주세요.");
    return doc;
  };
  const bomDoc = selected("bom","소요량 산출표"), purchaseDoc = selected("purchase","매입증빙"), tax = selected("tax","세금계산서");
  const [bom, purchase, taxFile] = await Promise.all([readLocalFile(bomDoc).then(readVisitSheet),readLocalFile(purchaseDoc).then(readVisitSheet),readLocalFile(tax)]);
  if (await taxFile.slice(0,4).text() !== "%PDF") throw new Error("세금계산서는 PDF 원문으로 등록해 주세요.");
  if (!bom("A1").includes("BOM") || purchase("B2") !== "TRANSACTION STATEMENT" || purchase("D17").toLowerCase() !== "kg" || bom("G11").toLowerCase() !== "kg") throw new Error("지원하는 BOM·거래명세서의 첫 시트와 kg 단위를 확인해 주세요.");
  if (!bom("C11") || bom("C11") !== purchase("C17") || purchase("G6") !== trade.supplier || bom("B2") !== trade.title || trade.material !== bom("C11")) throw new Error("거래명·원재료 규격·매입 기업이 원문과 일치하는지 확인해 주세요.");
  const nonblank = (start: number, end: number, field: string, cell: (address:string)=>string): boolean =>
    Array.from({length:end-start+1},(_:unknown,i:number):number=>start+i).some((i:number):boolean=>Boolean(cell(`${field}${i}`)));
  if (nonblank(8,10,"C",bom) || nonblank(12,28,"C",bom) || nonblank(18,37,"C",purchase)) throw new Error("복수 원재료나 여러 매입 행은 담당자 배부 검토가 필요합니다.");
  const qty = integer(bom("F11")), unit = integer(purchase("F17")), lot = integer(purchase("E17"));
  const p0 = trade.terms.p0, material = qty * unit, net = Number(data.get("taxNet"));
  if (![qty,unit,lot,net].every((n:number):boolean=>Number.isFinite(n)&&n>0) || lot*unit !== net || integer(bom("K11")) !== unit) throw new Error("세금계산서 공급가액·거래명세서 수량과 단가·BOM 기준단가를 다시 대조해 주세요.");
  const ratio = `${(material / p0 * 100).toFixed(1)}%`;
  const same = material === trade.terms.m0;
  const common: readonly (readonly [string,string])[] = [["거래",`${trade.buyer} / ${trade.supplier} · ${trade.title}`],["원재료와 비중",`${trade.material} · 기준 단가 ${won(p0)} 대비 ${ratio} (부가세 제외)`],["상태",same?"약정 입력값과 일치 · 수탁기업 자체 검토 / 외부기관 서명 없음":"등록한 약정 원재료비와 불일치 · 담당자 검토 필요"]];
  output.innerHTML = `<div class="fd-request"><h3>원재료비 ${esc(won(material))} / 개 · 비중 ${esc(ratio)}</h3><p>${esc(String(qty))} kg/개 × ${esc(won(unit))}/kg. ${esc(common[2]?.[1] ?? "")}</p><button class="fd-button" type="button" id="visit-cost">원가 검토보고서</button> ${same?'<button class="fd-button" type="button" id="visit-cert">공유용 확인서</button>':""}</div>`;
  output.querySelector("#visit-cost")?.addEventListener("click", ():void=>preview("원가 검토보고서",page("cost",pos(57,33,"FACCON 내부 검토 · 문서로 확인한 직접재료비",9,460)+pos(105,144,trade.title)+pos(300,144,"1")+pos(105,168,trade.material)+pos(300,168,"EA")+pos(356,227,won(material))+pos(356,279,won(material)))+textPage("원가 검토 근거",[...common,["직접재료비",`${qty} kg/개 × ${unit} 원/kg = ${won(material)} / 개`],["매입 대사",`${lot} kg × ${won(unit)} = ${won(net)}. 세금계산서 공급가액은 담당자가 입력했습니다.`],["검토 원문",`${bomDoc.name} / ${purchaseDoc.name} / ${tax.name}`],["검토 범위","노무비·경비·이윤은 입력 근거가 없어 공란입니다. 원가총액을 추정하지 않았습니다."]])));
  output.querySelector("#visit-cert")?.addEventListener("click", ():void=>preview("원재료 비중 검토확인서",textPage("원재료 비중 검토확인서",[...common,["공유 범위","매입처·소요량·매입단가·원문은 제외했습니다. 기준 단가와 비중으로 재료비는 역산 가능합니다."],["확인자","__________________     확인일 __________________"]])));
};
export const previewChange = (trade:LocalTrade, date:string):void => {
  const a = trade.adjustment;
  if (!a || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("조정 결과와 조정일을 확인해 주세요.");
  const previous = trade.adjustmentHistory?.at(-1);
  const current = calculateLocal(trade,a.indexValue);
  const fmt = (d:string):string=>d.slice(2).replaceAll("-",".");
  preview("단가 변동표",page("change",pos(57,33,"FACCON · 거래 입력값 / 미서명",9,450)+pos(271,184,trade.title,8,225)+pos(88,305,fmt(date),7,38)+pos(130,305,trade.material,6,43)+pos(182,305,String(trade.terms.i0),7,32)+pos(219,305,String(a.indexValue),7,32)+pos(253,305,(previous ? calculateLocal(trade,previous.indexValue).price : trade.terms.p0).toLocaleString("ko-KR"),7,41)+pos(297,305,current.price.toLocaleString("ko-KR"),7,38)+pos(339,305,fmt(a.effectiveDate),7,48)+pos(86,751,`적용 기준: ${trade.terms.basis==="delivery"?"납품일":"검수일"} / ${a.source}`,8,425)));
};
