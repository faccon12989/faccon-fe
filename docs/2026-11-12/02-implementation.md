# 구현 및 검사

[공유 안내로 돌아가기](../README.md)

> 이 본문은 2026-11-12 GitHub 업로드 직전의 작업 기록입니다. 미커밋·미업로드 상태 설명은 당시 기록이며, 현재 공유 방법은 위 안내를 따릅니다. 파일 해시는 업로드 전 로컬 파일 바이트 기준입니다.

## 5. 코드 구조와 파일별 역할

아래 경로는 모두 소스 루트 faccon-fe를 기준으로 한다.

### 5.1 신규 파일 5개

| 파일 | 역할 | 후속 AI가 먼저 볼 내용 |
| --- | --- | --- |
| src/demo.ts | 가상 상태 저장·복원·조회 | 상태 스키마, 완료 기준, 원본+패치 조합 |
| src/evidence.ts | 증빙 요약·CSV·인쇄용 HTML | 역할 필터, 계산액과 실적 분리 |
| src/views/review.ts | 신규 약정 검토 화면 | 가상 근거, 입력 검증, 산출, 확인 조건 |
| src/workflow.css | 공통 검토·증빙·반응형·인쇄 스타일 | 데스크톱/모바일/출력 규칙 |
| src/demo.test.ts | 상태·표시 범위·출력 회귀 테스트 | 9개 테스트와 유지해야 할 의미 |

### 5.2 수정 파일 20개

| 파일 | 변경 사항 |
| --- | --- |
| index.html | 소개 문구, A/B 체험 링크, 단가 변동률, 출력·체인 설명 |
| app.html | 데모 범위 안내, 동적 회사 패널, 내 업무 링크·초기화 버튼 |
| my.html | 데모 안내와 등록·운영 화면 이동·초기화 버튼 |
| start.html | 파일럿 신청 대신 거래 등록 체험 안내 |
| src/data.ts | AccessLog의 계약 연결, 가상 회사명 표기 보완 |
| src/types.ts | DemoState, TaskRequest 추가; AccessLog.contract 추가 |
| src/ui.ts | 상태 반영 계약 조회, 역할 필터, 지표 변동률 배지 |
| src/main.ts | review 라우트, 저장·출력·시뮬레이션 이벤트, 역할 회사명 변경 |
| src/my/flows.ts | 가상 회사 표기와 예시 발주일 수정 |
| src/my/my.ts | 요청·대기 분기, 공통 상태 연결, 출력 이벤트·키보드 처리 |
| src/my/screens.ts | 완료 기준·약정 상태·단가 변동률·증빙 요약 표시 |
| src/start/model.ts | 저신뢰 항목 보완, 선택적 초대·효과 측정, 매핑 중복 검증 |
| src/start/start.ts | A/B 진입, 가상 기본값, 적용일 보완, setup 저장 |
| src/start/steps.ts | 원문 발췌·보완 버튼, 공유 승인 안내, 데모 완료 화면 |
| src/views/contracts.ts | 실제 경로 연결, 초안 차단 안내, 가격·지표 구분 |
| src/views/dashboard.ts | 운영 중 합계, 저장 상태의 대조·할 일 반영 |
| src/views/operations.ts | 근거별 대조, 자사 자료·로그 필터, 증빙 화면 연결 |
| src/views/settlement.ts | 가상 지급명세·예치·실행 시뮬레이션으로 정정 |
| package.json | Rollup 공식 WebAssembly 패키지와 override 지정 |
| package-lock.json | 위 의존성의 재현 가능한 잠금파일 갱신 |

src/calc.ts와 기존 src/calc.test.ts는 이번 수정에서 변경하지 않았다. 기존 계산 테스트 5개를 유지한다. src/styles.css·src/site/site.css·src/my/my.css의 기존 기본 디자인을 유지하고 새 공통 CSS를 가져온다.

git diff --stat의 추가·삭제 줄 수에는 미추적 신규 파일이 포함되지 않는다. 변경 규모를 확인할 때 git status와 신규 파일을 함께 확인해야 한다.

## 6. 개발환경 변경과 실행 방법

기술 구성은 Vite + TypeScript이며 프런트엔드 프레임워크를 추가하지 않았다. 타입 검사는 strict 설정을 사용한다.

| 도구 | 버전 / 설정 |
| --- | --- |
| TypeScript | 5.6.3 |
| Vite | 5.4.11 |
| Vitest | 2.1.8 |
| Rollup 구현 | npm:@rollup/wasm-node@4.68.2 |
| override | rollup: $rollup |

변경 이유: 이 Windows 환경에서 기존 Rollup 네이티브 모듈 로딩이 Application Control 정책으로 차단됐다. OS 보안 설정은 변경하지 않고 공식 WebAssembly 구현으로 교체했다. npm 설치 시 기존 잠금파일이 즉시 변경되지 않아 별칭 패키지를 명시적으로 설치했고, 최종 package.json과 package-lock.json의 버전을 고정했다.

후속 개발자는 두 파일을 함께 유지한다. node_modules 안의 파일을 직접 고치는 방식으로 되돌리지 않는다. WebAssembly 구현은 빌드 도구의 대체이며 웹사이트의 고객 데이터나 블록체인 구조를 바꾼 것이 아니다.

PowerShell 실행 예시:

```powershell
Set-Location -LiteralPath 'faccon-fe'
git status --short
git branch --show-current

# 처음 복제했거나 의존성이 없을 때
npm.cmd ci

# 코드 규칙 → 타입 → 테스트 → 빌드
npm.cmd run check

# 로컬 화면
npm.cmd run dev
```

이 환경에서는 Git 명령이 작업 트리를 인식하지 못하는 경우가 있어, 저장소 루트에서 git --work-tree=. status --short 형식으로 확인했다. 이 현상만 보고 core.bare나 저장소 설정을 임의로 변경하지 않는다.

5173 포트가 이미 사용 중이면 Vite 출력의 실제 주소를 확인한다. 다른 포트는 localStorage가 따로 생성된다. 127.0.0.1 주소는 해당 컴퓨터의 로컬 주소이므로 팀원에게 공유할 공개 링크가 아니다.

## 7. 검증 결과와 확인하지 못한 범위

아래는 2026-11-12 직전 구현 작업에서 실제 실행한 결과다. 이번 문서 작성에서는 코드·Git 상태를 재확인했으며, 문서를 만든다는 이유로 동일 테스트를 다시 실행하지는 않았다.

| 검증 | 결과 |
| --- | --- |
| npm run check:style | 통과 |
| TypeScript 타입 검사 | 통과 |
| src/calc.test.ts | 기존 5개 통과 |
| src/demo.test.ts | 추가 9개 통과 |
| 합계 | 테스트 2개 파일, 14개 통과 |
| Vite 배포용 빌드 | 통과, 28개 모듈 변환 및 dist 생성 |
| git diff --check | 오류 없음; 일부 LF→CRLF 안내만 존재 |
| 로컬 HTTP | /, /start.html, /my.html, /app.html 각각 200 확인 |
| 실제 클릭·모바일·인쇄 시각 점검 | 미완료 — Computer Use 연결이 재시도 후에도 응답하지 않음 |

9개 추가 테스트가 확인하는 것:

1. 요청만으로 C-102가 완료되지 않는지.
2. 갱신 선택 세 가지가 서로 다른 대기 상태가 되는지.
3. 청구가 일치해도 발주 불일치가 사라지지 않는지.
4. 발주·청구·지급근거 순서와 시뮬레이션 지급 분리가 유지되는지.
5. 잘못된 저장 데이터와 선행조건 없는 완료 상태를 처리하는지.
6. 공급기업 요청·열람 화면에 다른 회사 정보가 섞이지 않는지.
7. 초안·종료 약정을 집계에서 제외하고 자사 증빙만 출력하는지.
8. 가상 반영 상태가 증빙 출력값에도 일치하는지.
9. CSV의 수식 시작 문자·따옴표를 안전하게 처리하는지.

이는 함수·출력 문자열 중심 테스트다. 실제 DOM 이벤트·다운로드 파일 열기·PDF 레이아웃·지갑 연동·서버 권한·법률 판단을 검증한 테스트가 아니다. HTTP 200 역시 화면의 모든 기능이 정상이라는 의미는 아니다.
