# AGENTS.md — 이 저장소에서 AI(Claude · Codex)가 지킬 규칙

이 저장소는 **비개발자 팀원도 AI에게 요청해서 고치는 프로젝트**입니다.
AI는 아래 규칙을 반드시 지키고, 끝나면 "확인 명령"을 실행해 통과한 것만 올립니다.

## 0. 프로젝트 한 줄 소개
단가조정 운영 서비스의 화면 데모입니다. Vite + TypeScript, 프레임워크 없음. **모든 데이터는 가상**입니다.

| 경로 | 화면 | 코드 위치 |
|---|---|---|
| `/` | 서비스 소개 | `index.html`, `src/site/` |
| `/start.html` | 시작하기 6단계 | `src/start/` |
| `/my.html` | 내 업무 (사용자 화면) | `src/my/` |
| `/app.html` | 운영 콘솔 | `src/views/`, `src/main.ts` |
| 공통 | 계산·데이터·타입·헬퍼 | `src/calc.ts`, `src/data.ts`, `src/types.ts`, `src/ui.ts` |

## 1. TypeScript 작성 규칙 (필수)

### 1-1. 함수는 무조건 화살표 함수
```ts
// ❌ 쓰지 않음
function formatWon(n: number): string { ... }
const f = function () { ... };

// ✅ 이렇게
const formatWon = (n: number): string => `${n.toLocaleString("ko-KR")}원`;

export const adjust = (c: Readonly<Contract>, it: number = c.it): AdjustResult => {
  ...
};
```
- 다른 파일에서 쓰는 함수는 `export const 이름 = (...) => {}` 로 내보냅니다.
- 함수의 **매개변수 타입과 반환 타입을 꼭 적습니다**.

### 1-2. ES6 이상 문법만 사용
| 쓰지 않음 | 대신 이렇게 |
|---|---|
| `var x = 1` | `const x = 1` (값이 바뀔 때만 `let`) |
| `"금액: " + won + "원"` | `` `금액: ${won}원` `` (템플릿 문자열) |
| `require("...")` | `import { x } from "./x"` |
| `module.exports = ...` | `export const ...` |
| `obj && obj.a && obj.a.b` | `obj?.a?.b` |
| `x !== null && x !== undefined ? x : 기본값` | `x ?? 기본값` |
| `for (var i = 0; ...)` 로 배열 만들기 | `list.map(...)`, `list.filter(...)`, `list.reduce(...)` |
| `Object.assign({}, a, b)` | `{ ...a, ...b }` |
| 콜백 지옥, `.then().then()` | `async/await` + `try/catch` |

### 1-3. 데이터는 직접 고치지 않고 새로 만든다 (불변)
```ts
// ❌ state.role = "buyer";
// ✅
state = { ...state, role: "buyer" };
list = [...list, newItem];
```

### 1-4. 타입
- `any` 금지. 모르는 값은 `unknown`으로 받고 확인한 뒤 씁니다.
- 공통 데이터 모양은 `src/types.ts`에 `interface`로 추가합니다.
- 고정된 선택지는 문자열 유니언으로: `type Role = "buyer" | "supplier";`
- 바뀌면 안 되는 배열·객체는 `readonly` / `Readonly<>`.

### 1-5. 화면(HTML 문자열) 만들 때
- 데이터 값을 HTML에 넣을 땐 **반드시 `esc()`** 로 감쌉니다 (`src/ui.ts`). 사용자가 입력한 값은 특히.
  ```ts
  `<b>${esc(company.name)}</b>`
  ```
- 금액은 `won()`, 퍼센트는 `pct()` 를 씁니다 (`src/calc.ts`).

### 1-6. 기타
- `console.log` 를 남기지 않습니다.
- 숫자에 의미가 있으면 이름을 붙입니다: `const TOAST_MS = 2200;`
- 파일 하나는 400줄 안쪽으로. 길어지면 화면별로 나눕니다.
- 주석과 화면 문구는 한국어로, 쉽게 씁니다.

## 2. 데이터 규칙
- 회사·사람·금액은 **가상**입니다. 회사명 뒤에 `(가상)`을 붙입니다.
- 실제 회사명, 실제 거래처, 전화번호, 비밀번호, API 키를 코드에 넣지 않습니다.
- 계산 규칙(`src/calc.ts`)을 바꾸면 `src/calc.test.ts`에 테스트도 추가합니다.
- 화면 문구에 "효과 보장", "과태료 면제", "포상 보장" 같은 약속을 쓰지 않습니다 (기획서 원칙).

## 3. 확인 명령 — 올리기 전에 반드시
```bash
npm install        # 처음 한 번
npm run check      # 규칙 검사 + 타입 검사 + 테스트 + 빌드를 한 번에
npm run dev        # http://127.0.0.1:5173 에서 직접 눈으로 확인
```
`npm run check` 가 실패하면 올리지 않습니다. 실패 메시지를 AI에게 그대로 붙여넣고 고쳐 달라고 하면 됩니다.

## 4. Git으로 올리는 방법
1. `main`에 바로 올리지 말고 브랜치를 만듭니다: `git switch -c 작업내용-짧게` (예: `fix/home-text`)
2. 커밋 메시지 형식: `종류: 무엇을 했는지`
   - 종류: `feat`(새 기능) `fix`(고침) `style`(모양) `docs`(문서) `refactor`(정리) `chore`(설정)
   - 예: `fix: 내 업무 화면 금액 줄바꿈 수정`
3. `git push -u origin 브랜치이름` 후 GitHub에서 Pull Request를 만들어 팀원 확인을 받습니다.

## 5. 배포 (faccon.naegoworks.com)
- 사이트는 `gh-pages` 브랜치의 빌드 결과물로 운영됩니다.
- `npm run build` → `dist/` 내용을 `gh-pages` 브랜치에 올립니다. `dist/CNAME`(faccon.naegoworks.com)이 빠지면 도메인이 끊기니 지우지 않습니다.
- 페이지 링크는 상대 경로(`./my.html`)로 씁니다. `/my.html`처럼 `/`로 시작하면 배포 후 깨질 수 있습니다.

## 6. AI에게 요청할 때 (팀원용 예시)
- "내 업무 화면에서 할 일 카드 문구를 더 짧게 바꿔줘. AGENTS.md 규칙 지키고 `npm run check` 통과시켜줘."
- "새 화면 추가해줘. 기존 `src/my/` 구조를 따라서."
