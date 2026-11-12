# 팀원용 수정본 실행 및 AI 인수인계

2026-11-12 / 기준 브랜치: `main` / 일반 변경은 검증 후 직접 반영

가상 데이터로 구성된 화면 데모입니다. 최신 main을 받으면 팀이 공유하는 수정 화면을 실행할 수 있습니다. main 푸시 후 자동 검증·배포가 완료되면 공개 사이트에 반영됩니다.

## 1. 처음 받는 경우

Git과 Node.js 22 LTS를 준비한 뒤 PowerShell에서 실행합니다.

```powershell
git clone --branch main https://github.com/faccon12989/faccon-fe.git
cd faccon-fe
npm.cmd ci
npm.cmd run dev
```

터미널에 표시된 로컬 주소를 브라우저로 엽니다. 기본 주소는 http://127.0.0.1:5173/ 입니다. 다른 팀원의 컴퓨터에서는 각자 위 명령으로 서버를 실행해야 합니다.

## 2. 이미 저장소가 있는 경우

먼저 `git status`로 본인의 미완료 수정사항을 확인하고 별도 작업 브랜치에 보존합니다. 미완료 변경을 덮어쓰거나 삭제하지 않습니다. 깨끗한 작업 상태에서 다음을 실행합니다.

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
npm.cmd ci
npm.cmd run dev
```

## 3. 문서 읽는 순서

먼저 [최신 통합 내역과 검증 결과](2026-11-12/04-summary-integration.md)를 읽습니다. 아래 3개는 PR #1 당시의 역사적 기록입니다. WASM 설치 안내 및 미검증 상태 설명은 현재 실행 지침이 아닙니다. 팀의 기존 package-lock.json 그대로 설치합니다.

1. [서비스 화면의 수정 목적과 변경 내용](2026-11-12/01-changes.md)
2. [수정 파일, 환경 설정, 검사 결과](2026-11-12/02-implementation.md)
3. [미완성 항목, 수동 확인 목록, AI 인수인계](2026-11-12/03-handoff.md)

AI에는 먼저 루트의 `AGENTS.md`와 위 문서 3개를 읽게 한 뒤 맡길 작업을 설명합니다. `CLAUDE.md`도 같은 저장소 규칙을 참조합니다.

## 4. 화면 확인과 검토

- 소개 → 시작하기 A/B → 내 업무 → 운영 콘솔 순서로 확인합니다.
- 자료 보완·승인, PO/청구/지급근거 확인, 증빙 CSV, 인쇄, 지급 시뮬레이션을 확인합니다.
- 가상 상태 일부는 브라우저 localStorage에만 저장됩니다. 다른 기기와 공유되는 서버 데이터가 아닙니다.
- `npm.cmd run check`로 코드 규칙·타입·테스트·빌드를 검사합니다.
- 업무요약↔상세 연결, 발주 반영 상태, 공급기업 전환, 데스크톱·모바일은 확인했습니다. 지급 시뮬레이션 최종 클릭·인쇄 전체 검토는 후속 확인 항목입니다.
- 실제 AI 호출·ERP 연동·전자서명·온체인 송금·고객 인증은 구현된 기능이 아닙니다.

## 5. 팀 작업 방법

2026-11-12 팀 협업 방침에 따라 일반 변경은 PR 없이 검증 후 main에 직접 반영합니다. 미완료 작업이 있으면 먼저 별도 브랜치에 보존하고 진행합니다. 각 팀원은 본인의 GitHub 계정으로 커밋하고 푸시합니다.

```powershell
git switch main
git pull --ff-only origin main
# 파일 수정 후
npm.cmd run check
# 수정한 화면의 주요 이용 흐름 확인
git add 수정한파일경로
git commit -m "fix: 수정 내용"
git fetch origin
# origin/main에 새 변경이 있으면 통합하고 재검증
git push origin main
```

푸시가 거절되면 강제 푸시하지 않습니다. 최신 팀원 변경을 반영하고 필요한 검증을 다시 수행합니다. 패키지·잠금 파일·Vite·TypeScript·GitHub Actions 설정 변경은 별도 PR과 개발 담당자 확인을 유지합니다.

`main` 푸시 시 공개 사이트가 자동 배포됩니다. GitHub Actions의 성공 여부를 확인합니다. `.env`, API 키, 지갑 개인키, 실제 고객 문서는 업로드하지 않습니다.

## 6. 변경 공유

- 일반 변경은 커밋 메시지와 변경내역 문서에 목적·검증 결과를 기록하고 커밋 링크를 공유합니다.
- PR이 필요한 설정 변경은 리뷰 요청과 변경 이유를 PR에 기록합니다.
- 직접 푸시가 모든 팀원에게 이메일로 전달된다고 가정하지 않습니다. 알림 여부는 각자의 GitHub 구독 설정에 따릅니다.
- 기존 변경내역 문서의 PR 안내는 당시 작업 방식의 기록이며, 현재 협업 규칙은 루트 AGENTS.md를 따릅니다.
- [GitHub 알림 안내](https://docs.github.com/en/subscriptions-and-notifications/concepts/about-notifications)
