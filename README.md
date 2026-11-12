# 단가조정 운영 서비스 · 프론트엔드 데모

납품대금 연동약정을 매달 계산하고, 발주·청구 반영과 제출자료까지 확인하는 서비스의 화면 데모입니다.
기획서 `PA-PLN-001 v1.2 (2026-11-10)` 기준으로 만들었고, **모든 회사명·금액·지표는 가상 데이터**입니다. 백엔드는 없습니다.

## 페이지

| 경로 | 화면 | 대상 |
|---|---|---|
| `/` | 서비스 소개 | 처음 방문한 고객 |
| `/start.html` | 시작하기 6단계 (시작 방식 → 회사 정보 → 약정 가져오기 → 공급기업 초대 → ERP 파일 연결 → 확인) | 가입 직후 구매 담당자 |
| `/my.html` | 단일 기업 대시보드 (업무요약, 약정, 자료·제출, 설정) | 매일 쓰는 구매 담당자 |
| `/app.html#/review` 등 | 상세 업무 (신규 검토, 반영 대조, 자료 공유, 제출 패키지) | 대시보드에서 해당 업무로 진입 |
| `/app.html#/supplier` | 자사 거래만 조회하는 공급기업 데모 | 공급기업 역할 체험 |
| `/app.html#/settlement` | 실제 송금 없는 독립 지급 시뮬레이션 | 내부 실증용 |

`/app.html` 및 예전 `/app.html#/dashboard`는 `/my.html`로 연결됩니다. 구매기업 업무요약은 한 곳에서만 제공합니다.
작업 이력과 팀 협업 안내는 [docs/README.md](docs/README.md)를 확인합니다.

## 실행

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run typecheck  # tsc --noEmit
npm test           # 계산 규칙 테스트 (vitest)
npm run build      # dist/ 로 정적 빌드
```

## 구조

```
src/
├── calc.ts          # 약정 산식 Pt = P0 + M0 × (It − I0) ÷ I0 (규칙 엔진, LLM 미사용)
├── calc.test.ts
├── data.ts          # 가상 데이터
├── types.ts
├── ui.ts            # 공통 헬퍼 (이스케이프 등)
├── site/            # 서비스 소개
├── start/           # 시작하기 단계 화면
├── my/              # 내 업무 화면
└── views/           # 운영 콘솔
```

Vite + TypeScript(strict), 프레임워크 없이 작성했습니다.
