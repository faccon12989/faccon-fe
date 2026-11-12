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
- 화면 문구는 합니다체로 씁니다 ("~해요" ❌ → "~합니다" ✅). 사업용 서비스입니다.

## 2-1. 패키지·빌드 설정은 건드리지 않는다
- `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `.github/workflows/` 는 **팀 합의 없이 바꾸지 않습니다.**
- 특히 빌드 도구를 다른 것으로 강제 교체하지 않습니다. 예: `"overrides": { "rollup": ... }`, `"rollup": "npm:@rollup/wasm-node@..."` ❌
- 내 컴퓨터에서만 `npm install`·`npm run dev`가 안 되면 설정을 고치지 말고, 오류 메시지를 팀 채팅에 올려 함께 해결합니다. 이 설정은 자동 배포(GitHub Actions)에도 그대로 쓰이므로, 바꾸면 사이트 배포가 멈출 수 있습니다.
- 꼭 바꿔야 하면 그 변경만 따로 PR을 만들고, 이유를 적어 개발 담당자의 확인을 받습니다.

## 3. 확인 명령 — 올리기 전에 반드시
```bash
npm install        # 처음 한 번
npm run check      # 규칙 검사 + 타입 검사 + 테스트 + 빌드를 한 번에
npm run dev        # http://127.0.0.1:5173 에서 직접 눈으로 확인
```
`npm run check` 가 실패하면 올리지 않습니다. 실패 메시지를 AI에게 그대로 붙여넣고 고쳐 달라고 하면 됩니다.

## 4. Git으로 올리는 방법
2026-11-12 팀 협업 방침: 일반적인 화면·기능 수정은 검증 후 PR 없이 `main`에 직접 반영합니다.

1. `git status`로 미완료 작업을 확인하고 보존합니다. 최신 `origin/main`을 받아 팀원 변경을 먼저 반영합니다.
2. 개인 계정으로 커밋합니다. 작성자 설정과 실제 GitHub 인증 계정을 각각 확인합니다.
3. `npm run check`를 통과시키고, 변경한 화면의 주요 이용 흐름을 확인합니다. 검사 실패나 미해결 문제가 있으면 올리지 않습니다.
4. 커밋 메시지는 `종류: 무엇을 했는지` 형식으로 작성합니다. 종류는 `feat`, `fix`, `style`, `docs`, `refactor`, `chore`를 사용합니다.
5. 푸시 직전에 최신 main을 확인합니다. 팀원 변경이 추가되면 먼저 통합하고 필요한 검증을 다시 수행한 뒤 `git push origin main`으로 올립니다. 강제 푸시는 하지 않습니다.
6. 자동 배포 결과를 확인하고 변경 내용을 팀에 공유합니다.

패키지·빌드 설정 변경은 2-1절의 별도 PR 및 개발 담당자 확인 절차를 유지합니다. 보호 규칙이 직접 푸시를 차단하면 우회하거나 해제하지 않고 기존 PR 절차를 사용합니다.

## 5. 배포 (faccon.naegoworks.com) — 자동
- **`main`에 올라오면 자동으로 배포됩니다.** 따로 할 일이 없습니다 (`.github/workflows/deploy.yml`).
- 자동 배포는 먼저 `npm run check`를 돌립니다. **검사가 실패하면 사이트는 바뀌지 않고** 이전 화면이 그대로 남습니다.
- 진행 상황: GitHub 저장소 → **Actions** 탭 → "사이트 자동 배포". 초록 체크면 성공, 빨간 X면 실패(눌러서 메시지를 AI에게 보여주세요).
- 보통 2~3분 뒤 사이트에 반영됩니다. 안 바뀌어 보이면 브라우저 새로고침(강력 새로고침)을 해보세요.
- `public/CNAME`(faccon.naegoworks.com)은 지우지 않습니다.
- 페이지 링크는 상대 경로(`./my.html`)로 씁니다. `/my.html`처럼 `/`로 시작하면 배포 후 깨질 수 있습니다.
- `gh-pages` 브랜치는 예전 수동 배포용이라 더 이상 쓰지 않습니다.

## 6. AI에게 요청할 때 (팀원용 예시)
- "내 업무 화면에서 할 일 카드 문구를 더 짧게 바꿔줘. AGENTS.md 규칙 지키고 `npm run check` 통과시켜줘."
- "새 화면 추가해줘. 기존 `src/my/` 구조를 따라서."
