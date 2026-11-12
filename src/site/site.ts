/* 서비스 소개 페이지: 첫 화면 변동표 */
import "./site.css";
import { adjust, pct, signedWon, won } from "../calc";
import { CONTRACTS, isCounted, RECONCILE } from "../data";
import { esc } from "../ui";

type Tone = "ok" | "bad" | "warn";

/** 첫 화면 변동표: 기업 대시보드와 같은 가상 데이터로 그린다 */
const renderLedger = (): void => {
  const body = document.getElementById("ledger-rows");
  const foot = document.getElementById("ledger-foot");
  if (!body || !foot) return;
  const rows = CONTRACTS.filter(isCounted).map((c) => {
    const r = adjust(c);
    const po = RECONCILE.find((x) => x.contract === c.id)?.poPrice ?? null;
    const missed = po !== null && po !== r.price;
    const [tone, label]: readonly [Tone, string] = c.status === "renew" ? ["warn", "계약 갱신"]
      : missed ? ["bad", "발주서 수정"] : ["ok", "맞음"];
    return { c, r, po, missed, tone, label };
  });
  body.innerHTML = rows.map(({ c, r, po, missed, tone, label }) => `<tr class="${missed ? "hit" : ""}">
      <td><b>${esc(c.item)}</b><small>${esc(c.id)}</small></td>
      <td class="n">${r.it} <small>${r.rate > 0 ? "+" : ""}${pct(r.rate)}</small></td>
      <td class="n">${won(r.price)}</td>
      <td class="n ${missed ? "strike" : ""}">${po === null ? "-" : won(po)}</td>
      <td><span class="st ${tone}">${label}</span></td></tr>`).join("");
  const missedRows = rows.filter((x) => x.missed);
  const gap = missedRows.reduce((a, x) => a + x.r.total, 0);
  foot.innerHTML = missedRows.length
    ? `발주서에 아직 옛 단가가 남은 품목이 ${missedRows.length}개 있어요. 이대로면 <b>${signedWon(gap)}</b>이 빠집니다.`
    : "이번 달 단가는 발주서에 모두 들어갔어요.";
};

renderLedger();
