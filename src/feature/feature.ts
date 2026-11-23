/* 서비스 소개 상세 페이지: feature.html?f=calc|recon|share|security */
import "../home/home.css";
import { mountSiteChrome } from "../shared/site-chrome";
import "../home/home-feel.css";
import "../faq/faq.css";
import "./feature.css";
import { esc } from "../ui";
import { FEATURES, isFeatureId, type Feature } from "./content";

const pick = (): Feature => {
  const id = new URLSearchParams(location.search).get("f");
  return FEATURES.find((f) => f.id === (isFeatureId(id) ? id : "calc")) ?? FEATURES[0]!;
};

const hero = (f: Feature): string => `
  <section class="feat-hero"><div class="section-heading centered"><span><b>서비스 소개</b>${esc(f.label)}</span>
    <h2>${f.titleHtml}</h2><p>${esc(f.lead)}</p></div>
    ${f.shot ? `<figure class="show-shot feat-shot"><img src="${esc(f.shot.src)}" width="${f.shot.width}" height="${f.shot.height}" alt="${esc(f.shot.alt)}"></figure>` : ""}
  </section>`;

const example = (f: Feature): string => f.example ? `
  <section class="feat-example"><h3>계산 예시 <small>가상 데이터</small></h3>
    <dl>${f.example.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></section>` : "";

const points = (f: Feature): string => `
  <section class="feat-points"><ol>${f.points.map((p, i) => `
    <li><b>${String(i + 1).padStart(2, "0")}</b><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></li>`).join("")}</ol>
    ${f.note ? `<p class="feat-note">${esc(f.note)}</p>` : ""}</section>`;

const others = (f: Feature): string => `
  <section class="feat-others"><h3>다른 기능도 보기</h3><div>${FEATURES.filter((o) => o.id !== f.id).map((o) => `
    <button data-go="./feature.html?f=${o.id}"><strong>${esc(o.label)}</strong><small>${esc(o.summary)}</small></button>`).join("")}</div>
    <div class="faq-cta"><button class="home-cta" data-go="./consult.html">도입 상담 신청</button><button class="outline-cta" data-go="./pilot.html">도입 방식 보기</button></div>
  </section>`;

const f = pick();
document.title = `${f.label} · Faccon`;
const main = document.querySelector<HTMLElement>("#feature");
if (main) main.innerHTML = hero(f) + example(f) + points(f) + others(f);

mountSiteChrome();
