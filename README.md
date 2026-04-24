# Party Cupid MVP 💝

오프라인 파티에서 익명 호감도 투표 + 매칭 SaaS — Next.js 14 + Supabase 기반.

---

## 🚀 셋업 가이드 (10분)

### 1. Supabase 프로젝트 준비

기존 프로젝트 1개를 pause하거나, 새 이메일로 가입하여 무료 슬롯 확보 후:

1. [supabase.com](https://supabase.com) → New Project → 이름 `party-cupid` (Region: Northeast Asia (Seoul))
2. 프로젝트 생성 완료 후 → **Project Settings → API**에서 다음 3개 키 복사:
   - `Project URL`
   - `anon public` key
   - `service_role secret` key (🔴 클라이언트 노출 금지)

### 2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일에 위 3개 키 붙여넣기:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. SQL 마이그레이션 실행

Supabase 대시보드 → **SQL Editor** → New query → 다음 5개 파일 **순서대로** 실행:

```
supabase/migrations/0001_initial_schema.sql              # 9 테이블 생성
supabase/migrations/0002_rls_policies.sql                # RLS 권한 정책 (15+)
supabase/migrations/0003_triggers.sql                    # auth.users → profiles 자동 생성
supabase/migrations/0004_matches_host_insert.sql         # 매칭 INSERT 정책
supabase/migrations/0005_enable_realtime.sql             # Realtime publication 등록
supabase/migrations/0006_fix_participants_rls_recursion.sql  # RLS 무한 재귀 수정 (필수)
supabase/migrations/0007_codex_security_fixes.sql            # Codex 보안 4건 (필수)
supabase/migrations/0008_auto_entry_number.sql               # 닉네임 입장 trigger (필수)
```

각 파일 내용을 SQL Editor에 붙여넣고 **Run** 클릭. 에러 없이 "Success" 메시지 확인.

### 4. Auth 설정 (3가지 토글)

Supabase 대시보드 → **Authentication → Providers**:

| 항목 | 위치 | 설정 | 이유 |
|------|------|:----:|------|
| **Anonymous Sign-Ins** | Providers → Anonymous | **ON** | 참여자가 회원가입 없이 닉네임만 입력하고 입장 |
| **Confirm email** | Providers → Email → Confirm email | **OFF** | 주최자 가입 즉시 자동 로그인 (메일 인증 단계 생략) |
| **Secure email change** | Providers → Email | ON (기본) 유지 | 이메일 변경 시 인증 (보안) |

> Confirm email OFF는 MVP 출시 우선 UX. 프로덕션 운영 시 ON 검토 권장.

### 5. 의존성 설치 + 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

---

## ✅ 동작 확인 시나리오

### 주최자 가입 → 대시보드 진입
1. `/signup` → 이메일/비밀번호 입력 → 가입
2. 이메일 인증 메일 확인 → 링크 클릭 → `/dashboard` 자동 진입
3. profiles 테이블에 row 자동 생성됐는지 Supabase Table Editor에서 확인

### 참여자 입장 (anonymous)
1. Supabase Table Editor에서 `rooms` 테이블에 row 직접 INSERT (방 생성 UI는 다음 단계 구현)
   - `code: 'TEST01'`, `host_id: <주최자 user id>`, `name: '테스트 파티'`
2. 다른 브라우저(또는 시크릿 모드)에서 `/r/TEST01` 접속
3. 약관 동의 → 닉네임 입력 → 입장
4. `participants` 테이블에 row 생성됐는지 확인

---

## 📁 프로젝트 구조

```
party-cupid-mvp/
├── app/
│   ├── layout.tsx, globals.css, page.tsx       # 루트 + 랜딩
│   ├── login/, signup/, forgot-password/       # 주최자 인증
│   ├── auth/callback/route.ts                  # OAuth/매직 링크 콜백
│   ├── dashboard/                              # 주최자 대시보드 (placeholder)
│   └── r/[code]/                               # 참여자 라우트
│       ├── page.tsx                            # 진입 라우터
│       ├── consent/, nickname/, home/
├── lib/supabase/
│   ├── client.ts, server.ts, middleware.ts
├── middleware.ts                                # Supabase 세션 갱신
├── supabase/migrations/
│   ├── 0001_initial_schema.sql                 # 9 테이블
│   ├── 0002_rls_policies.sql                   # RLS 정책
│   └── 0003_triggers.sql                       # 자동 생성
├── package.json, tsconfig.json, next.config.mjs
├── tailwind.config.ts                          # Party Cupid 디자인 토큰
└── .env.example
```

---

## 🎨 디자인 시스템

- **Primary**: `#FF4D6D` (warm pink)
- **Accent**: `#7C3AED` (purple)
- **Bg**: `#FFF7F8` (soft pink)
- **Font**: Plus Jakarta Sans
- **한국어**: `word-break: keep-all` 전역 적용

상세 와이어프레임: `prototype/v3-00-landing.html`, `design/v13/` 참조.

---

## 📋 구현 상태 (~92% MVP+)

### 호스트 도구 (8 페이지)
- ✅ 가입/로그인 (이메일+비밀번호, confirm OFF)
- ✅ 대시보드 (방 목록)
- ✅ 새 방 만들기 (rooms + 기본 4단계 자동 생성)
- ✅ 라이브 운영 (QR 동적 생성, 단계 진행, 강퇴, 실시간 투표 카운트)
- ✅ 단계 편집 (이름/투표 토글/추가/삭제/순서 이동)
- ✅ 매칭 결과 뷰 (단계별 통계 + 매칭 쌍)
- ✅ 신고 처리 (메시지 숨기기/강퇴/기각)

### 참여자 플로우 (10 페이지)
- ✅ QR 진입 → 약관 → 닉네임 (Anonymous Auth)
- ✅ 홈 (단계 progress, 누적 ❤, 매칭 수, 쪽지 수)
- ✅ 참여자 목록 + 상세 (❤ 토글)
- ✅ 1:1 쪽지 (양방향 매칭 후만)
- ✅ 매칭 결과 (파티 종료 후 공개)
- ✅ 신고 (참여자/메시지)

### 인프라
- ✅ DB: 9 테이블 + 15+ RLS 정책 + Realtime publication
- ✅ Server Actions 13개 (투표/단계/매칭/쪽지/신고)
- ✅ Realtime refresh (메시지/투표/단계/매칭 자동 갱신)
- ✅ Playwright E2E (스모크 6 케이스)
- ⚠️ 비밀번호 재설정 메일: 미지원 (안내 페이지로 대체)
- ⚠️ 푸시 알림: post-MVP

---

## 🚀 Vercel 배포

### 1. Vercel 프로젝트 연결

[vercel.com](https://vercel.com/new) → **Import Git Repository** → 본 GitHub repo 선택 → Framework: **Next.js** 자동 감지 → Deploy

### 2. 환경변수 설정 (Vercel 대시보드 → Settings → Environment Variables)

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (선택, server-only) | Production만 |

설정 후 → **Deployments** → 최신 deployment 옆 ⋯ → **Redeploy** (환경변수 반영).

### 3. Supabase 대시보드 추가 작업

**Authentication → URL Configuration**:
- **Site URL**: `https://<your-project>.vercel.app`
- **Redirect URLs** 추가:
  - `https://<your-project>.vercel.app/auth/callback`
  - `https://<your-project>.vercel.app/**` (와일드카드)

### 4. QR 코드 도메인 자동 감지

코드는 `headers()`의 `x-forwarded-host`를 사용하여 자동으로 Vercel 도메인을 인식합니다.
별도 환경변수 불필요. (커스텀 도메인 사용 시 그것도 자동 감지됨)

### 5. (선택) 커스텀 도메인

Vercel → Settings → Domains → Add → Supabase Redirect URLs에도 추가

---

## 📚 참고 문서

- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [기획서 v6](docs/기획서.md)
- [기능 명세 v6](docs/features.md)
- [페이지 구조 v6](docs/pages.md)

---

## 🔴 보안 주의사항

- `SUPABASE_SERVICE_ROLE_KEY`는 **절대 클라이언트(브라우저)에 노출 금지**. 서버 코드(`lib/supabase/server.ts` 또는 Edge Function)에서만 사용.
- `.env.local` 파일은 `.gitignore`에 포함되어 있음 (커밋 금지)
- RLS 정책 변경 시 반드시 SQL 마이그레이션으로 관리 (수동 변경 금지)
