# Princessgram — Next.js Auth Phase 1

기존 정적 `index.html` SNS 앱을 그대로 보존하면서, 그 앞단에 Next.js로
회원가입 / 로그인 / 이메일 인증 / 사용자별 DB를 얹은 구조입니다.

## 폴더 구조

```
project/
├── index.html        ← 기존 SNS UI (절대 수정 X)
├── assets/           ← 기존 이미지/personality.txt
└── next/             ← 본 폴더 (Next.js 앱)
    ├── app/          ← App Router 페이지 + API
    ├── lib/          ← prisma, auth, email, otp, rate-limit
    ├── prisma/       ← schema + seed
    ├── public/legacy/← prebuild가 ../index.html, ../assets 복사
    └── scripts/      ← copy-legacy.mjs
```

## 사전 준비

1. **Node.js 20+** 설치
2. **Docker Desktop** 설치 (Postgres + pgvector 띄우기 위해)
3. **Resend 계정 + API 키**

## 처음 실행 순서

```bash
cd next
npm install

# .env.local 만들기
cp .env.local.example .env.local
# 편집:
#   AUTH_SECRET="<openssl rand -base64 32>"
#   RESEND_API_KEY="re_..."
#   RESEND_FROM_EMAIL="Princessgram <onboarding@resend.dev>"
#   (DATABASE_URL은 그대로 두면 됨 — 로컬 Docker용)

# Postgres + pgvector 띄우기
npm run db:up

# DB 스키마 적용 + 공주 시드
npm run db:push
npm run db:seed

# 개발 서버
npm run dev
# → http://localhost:3000
```

## 페이지

| 경로 | 설명 |
|---|---|
| `/` | 랜딩 (비로그인) / 로그인이면 /app 리다이렉트 |
| `/signup` | 회원가입 (이메일·비밀번호·닉네임·공주이름·관심사·약관) |
| `/verify-email` | 6자리 OTP 입력 |
| `/login` | 로그인 |
| `/forgot-password` | 비밀번호 찾기 메일 발송 |
| `/reset-password?token=...` | 새 비밀번호 설정 |
| `/app` | 기존 index.html SNS (로그인 필수, 미들웨어 보호) |
| `/admin/princesses` | (admin) 공주 목록 |
| `/admin/princesses/[id]` | (admin) personality JSON 직접 편집 |
| `/settings/intimacy` | 내 공주별 친밀도 점수 (정렬+레벨+진행바) |
| `/settings/memory` | 내 AI 메모리 (저장된 일기/DM 목록 + 개별 삭제) |
| `/me/feed` | DB에 저장된 내 게시글·DM (다른 기기에서도 접근 가능) |

## API

| 메서드/경로 | 설명 |
|---|---|
| POST `/api/signup` | 계정 생성 + OTP 발송 |
| POST `/api/verify-email` | OTP 검증, emailVerified 세팅 |
| POST `/api/resend-verification` | OTP 재전송 (60초 쿨다운) |
| POST `/api/forgot-password` | 비밀번호 재설정 메일 |
| POST `/api/reset-password` | 토큰으로 비밀번호 변경 |
| GET `/api/me` | 현재 세션 사용자 정보 |
| GET `/api/princesses` | 공주 5명 목록 + 구조화된 personality (Princess DB) |
| GET `/api/princesses?id=lily_princess` | 단일 공주 |
| GET `/api/princesses?fields=moderation,emojis` | 지정 필드만 |
| PUT `/api/princesses?id=...` | (admin) personality 부분 머지 업데이트 |
| POST `/api/intimacy/event` | 친밀도 이벤트 핑 `{princessId, action}` (로그인 필수) |
| GET `/api/intimacy/me` | 내 공주별 친밀도 점수 목록 |
| POST `/api/memory/save` | 임베딩+텍스트 메모리 저장 (클라이언트가 embed 후 전송) |
| POST `/api/memory/search` | 임베딩으로 top-K 메모리 검색 |
| GET `/api/memory` | 내 메모리 목록 (최신 100건) |
| DELETE `/api/memory?id=...` | 메모리 삭제 |
| GET / POST / DELETE `/api/posts` | 내 게시글 CRUD |
| POST `/api/posts/[id]/comments` | 내 게시글에 댓글 (사용자 또는 공주) |
| GET `/api/dm` | 내 DM 스레드 목록 |
| GET / POST `/api/dm/[princessId]` | 특정 공주와의 메시지 조회·전송 |
| POST `/api/upload` | 이미지 업로드 (클라 리사이즈 후 data URL을 받아 UploadedFile에 저장) |
| GET / POST `/api/char-posts/[charId]/[idx]/like` | 캐릭터 게시글 좋아요 (토글) |
| GET / POST `/api/char-posts/[charId]/[idx]/comments` | 캐릭터 게시글에 내가 단 댓글 |
| POST `/api/char-posts/comments/[id]/replies` | 캐릭터 게시글 댓글의 답글 |
| `/api/auth/*` | Auth.js v5 핸들러 (signin/signout 등) |

## 데이터베이스 운영

```bash
# Prisma Studio (GUI)
npm run db:studio

# 마이그레이션 (production)
npm run db:migrate

# 컨테이너 중지
npm run db:down
```

## 1단계 범위 / 2단계로 미룬 것

**1단계 (이번)**
- 이메일+비밀번호 가입/로그인 (bcrypt cost 12)
- Resend 이메일 인증 (6자리 OTP, 15분 만료, 5회 시도 제한)
- 비밀번호 찾기/재설정 (sha256 토큰, 30분, 1회용)
- 사용자 프로필 (닉네임·공주이름·관심사·약관)
- Auth.js v5 JWT 세션, 미들웨어로 /app 보호
- 기존 index.html을 /app에서 그대로 서빙

**Phase 2 완료**
- ✅ 공주 5명 personality DB화 (`lib/princess-personality.ts` + `Princess.personality` JSON + `GET /api/princesses`)
- ✅ index.html이 페이지 진입 시 `/api/princesses` + `/api/me` fetch → MODERATION/CHARACTERS systemPrompt 보강, 헤더 닉네임 표시
- ✅ 관리자 페이지 `/admin/princesses` (`ADMIN_EMAILS` 환경변수로 가드)
- ✅ 친밀도 시스템: `UserPrincessRelation` + `POST /api/intimacy/event` + `GET /api/intimacy/me`. index.html이 좋아요/댓글/답글/DM/모더레이션 액션마다 자동 ping
- ✅ `/settings/intimacy` UI + 헤더 친밀도 뱃지

**Phase 3 완료 (옵션 A — 사용자 본인 OpenAI 키)**
- ✅ pgvector 메모리: `Memory` 테이블 + vector(1536) + HNSW 인덱스
- ✅ `POST /api/memory/save` / `POST /api/memory/search` / `GET /api/memory` / `DELETE`
- ✅ 브라우저에서 OpenAI `text-embedding-3-small` 직접 호출 (서버는 키 모름)
- ✅ index.html이 일기 발행/DM 전송 시 자동 저장, AI 호출 직전에 자동 검색해 시스템 프롬프트에 주입
- ✅ `/settings/memory` 페이지에서 저장된 메모리 확인·개별 삭제

**Phase 4 완료 (사용자별 게시글/DM DB 마이그레이션)**
- ✅ `Post`, `DiaryComment`, `DirectMessageThread`, `DirectMessage` 정식 모델로 교체
- ✅ `/api/posts` (GET/POST/DELETE), `/api/posts/[id]/comments`, `/api/dm`, `/api/dm/[princessId]` (GET/POST)
- ✅ index.html이 일기 발행/DM 전송/내 게시글 댓글 시 dual-write → DB에도 저장
- ✅ `/me/feed` 페이지: 다른 기기로 로그인해도 DB 데이터 그대로 보임

**Phase 4.1 완료 (DB → 로컬 UI 백필)**
- ✅ `/app` 진입 시 피드/DM이 비어있으면 `/api/posts`, `/api/dm`, `/api/dm/[princessId]` 자동 조회 → DOM 카드 생성 + `POST_TEXTS`/`DM_THREADS` 채우기 + persistState
- ✅ 다른 기기로 로그인 → `/app` 가면 이전 일기·DM이 그대로 복원 (댓글 포함)

**Phase 5 완료**
- ✅ 공주 자동 댓글도 DB 저장 (`addComment` 후킹 → `POST /api/posts/[id]/comments` with princessId). `__postIdMap`으로 localPostId ↔ dbPostId 매핑
- ✅ 파일 업로드 MVP: 클라이언트 사이드 리사이즈(1024px, JPEG 0.8) → `/api/upload` → `UploadedFile` 저장, 응답 url을 그대로 활용. S3/UploadThing 전환 시 URL만 교체하면 됨
- ✅ 친밀도 → systemPrompt 동적 보강: `getIntimacyMap()` 5분 캐시, 점수 구간별 `[친밀도]` 톤 라인을 aiChat 호출 시 자동 주입

**Phase 6 완료**
- ✅ 캐릭터 게시글 좋아요·댓글 DB 저장 (`CharPostLike`, `CharPostComment`, `CharPostReply` 모델 + API + index.html dual-write)
- ✅ Vercel + Neon 배포 가이드 (`DEPLOY.md`) — Build script `vercel-build`로 `prisma migrate deploy` 자동
- ✅ persona summary 자동 생성: 일기 5편 이상이면 6시간 간격으로 OpenAI mini 요약 → `kind:'persona_summary'`로 메모리 저장, 이후 AI 응답에 회상되어 사용자 이해도↑

**아직 미구현**
- ~~전화번호 인증~~ — 사용 안 함
- UploadThing/S3 같은 외부 스토리지 전환 (현재는 data URL을 DB에 저장 — 작은 규모에선 OK)
- 공주가 캐릭터 게시글 댓글에 다는 답글 DB 저장 (현재는 사용자 댓글만)

## 보안 체크리스트

- bcrypt cost 12
- OTP 15분 만료, 5회 시도 제한
- 비밀번호 재설정 토큰 30분, 1회용, sha256 해시 저장
- IP 기반 rate limit (in-memory, 프로덕션은 Upstash로 교체 필요)
- 모든 보호 API에서 `auth()` 검증 후 userId 격리
- 환경변수 `.env.local` (gitignore)
- HTTPS는 Vercel 자동
- Auth.js JWT 쿠키 `httpOnly`, `sameSite: lax`

## 기존 index.html과의 관계

- `index.html`은 **읽기만** 함. 빌드 직전 `scripts/copy-legacy.mjs`가
  `next/public/legacy/`로 복사. 원본은 한 글자도 안 건드림.
- `/app` 진입 시 미들웨어 → 세션 체크 → rewrite → `/legacy/index.html` 서빙.
- legacy HTML의 `localStorage` 키는 신규 시스템과 분리되어 있어 충돌 없음.
- 추후 React로 옮길 때도 이 구조 안에서 점진 이전 가능.
