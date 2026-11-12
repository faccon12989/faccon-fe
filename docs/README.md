# 팀원용 수정본 실행 및 AI 인수인계

2026-11-12 / 업무요약 통합 작업 브랜치: `feat/unify-work-summary` / 검토 대상: `main`

현재 브랜치는 가상 데이터로 구성된 화면 데모입니다. 공유 브랜치를 받으면 수정 화면을 실행할 수 있습니다. `main`에 병합되기 전에는 공개 사이트에 반영되지 않습니다.

## 1. 처음 받는 경우

Git과 Node.js 22 LTS를 준비한 뒤 PowerShell에서 실행합니다.

```powershell
git clone --branch feat/unify-work-summary https://github.com/faccon12989/faccon-fe.git
cd faccon-fe
npm.cmd ci
npm.cmd run dev
```

터미널에 표시된 로컬 주소를 브라우저로 엽니다. 기본 주소는 http://127.0.0.1:5173/ 입니다. 다른 팀원의 컴퓨터에서는 각자 위 명령으로 서버를 실행해야 합니다.

## 2. 이미 저장소가 있는 경우

먼저 `git status`로 본인의 미완료 수정사항을 확인하고 별도 작업 브랜치에 보존합니다. 미완료 변경을 덮어쓰거나 삭제하지 않습니다. 깨끗한 작업 상태에서 다음을 실행합니다.

```powershell
git fetch origin
git switch feat/unify-work-summary
git pull --ff-only origin feat/unify-work-summary
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

수정할 때는 현재 브랜치에서 개인 작업 브랜치를 만들고, 검사 후 별도 PR로 검토받습니다. PR #2에서 새 디자인과 기존 기능을 이미 통합했습니다. 새 작업은 최신 main을 기준으로 별도 브랜치에서 시작합니다.

```powershell
git switch -c fix/your-task
# 파일 수정 후
npm.cmd run check
git add 수정한파일경로
git commit -m "fix: 수정 내용"
git push -u origin fix/your-task
```

`main` 병합 시 공개 사이트가 자동 배포됩니다. 팀 검토가 끝난 PR만 병합합니다. `.env`, API 키, 지갑 개인키, 실제 고객 문서는 업로드하지 않습니다.

## 6. PR·메일 협업

- 리뷰 요청과 변경 이유는 GitHub PR에 기록합니다. 카카오톡은 PR 링크 안내에 사용하면 됩니다.
- 패키지·잠금 파일·Vite·TypeScript·GitHub Actions 설정은 팀 합의 없이 바꾸지 않습니다. 이번 브랜치는 WASM 교체 없이 네이티브 Rollup 구성으로 검사했습니다.
- 리뷰 요청·멘션·참여 중인 PR의 댓글은 수신자의 GitHub 알림 설정에 따라 이메일로도 전달됩니다. 특정 Gmail로 실제 전달되었는지는 여기서 확인할 수 없습니다.
- GitHub 알림은 일반적으로 notifications@github.com에서 발송되며, 직접 작성한 Gmail 메일과 구분합니다.
- [GitHub 알림 안내](https://docs.github.com/en/subscriptions-and-notifications/concepts/about-notifications)
- [GitHub 이메일 헤더](https://docs.github.com/en/subscriptions-and-notifications/reference/email-notification-headers)
