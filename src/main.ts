/* 이전 운영 콘솔 주소도 로그인한 회사의 단일 업무 화면으로 연결합니다. */
import { readSession } from "./local-store";

const query = new URLSearchParams(location.hash.split("?")[1] ?? "");
const contract = query.get("id");
const destination = contract ? `#/trade/${encodeURIComponent(contract)}` : "#/trades";
location.replace(readSession() ? `./my.html${destination}` : "./login.html");
