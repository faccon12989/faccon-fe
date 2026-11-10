// 코드 규칙 검사: function 선언, var, any, console.log 를 찾으면 실패한다.
// 실행: npm run check:style
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const RULES = [
  { re: /^\s*(export\s+)?(async\s+)?function\s+\w+/, msg: "function 선언 대신 화살표 함수(const 이름 = () => {})를 쓰세요" },
  { re: /\bfunction\s*\(/, msg: "익명 function 대신 화살표 함수(() => {})를 쓰세요" },
  { re: /\bvar\s+\w+/, msg: "var 대신 const(바뀌면 let)를 쓰세요" },
  { re: /:\s*any\b|<any>|as any\b/, msg: "any 대신 정확한 타입을 쓰세요 (모르면 unknown)" },
  { re: /\bconsole\.log\(/, msg: "console.log 를 지우세요" },
];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith(".ts") ? [path] : [];
  });

const problems = walk("src").flatMap((file) =>
  readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, i) =>
      line.trim().startsWith("//") || line.trim().startsWith("*")
        ? []
        : RULES.filter((r) => r.re.test(line)).map((r) => `${file}:${i + 1}  ${r.msg}\n    ${line.trim()}`),
    ),
);

if (problems.length) {
  console.error(`규칙 위반 ${problems.length}건\n\n${problems.join("\n")}`);
  process.exit(1);
}
console.info("규칙 검사 통과");
