# 배포 가이드 — Vercel + Neon

## 한눈에

- **앱 호스팅**: Vercel (Next.js auto-detect)
- **DB**: Neon Free Tier (pgvector 지원)
- **이메일**: Resend
- **루트 디렉토리**: `next/` (Vercel 프로젝트의 Root Directory로 지정)

## 1. Neon DB 준비

1. https://neon.tech 가입 → 새 프로젝트 생성 (region은 `Asia Pacific (Singapore)` 또는 `US East`)
2. 데이터베이스 이름: `princessgram` (또는 자유롭게)
3. **pgvector 활성화** — Neon의 Console → SQL Editor에서:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. **Connection string** 두 개 복사
   - `Pooled connection` → `DATABASE_URL` 로 사용 (앱 런타임)
   - `Direct connection` → `DIRECT_URL` 로 사용 (Prisma migrate용)

> Prisma 5.x + 서버리스 환경에서는 connection pooler를 통한 connection이 권장됩니다. `schema.prisma`에 `directUrl` 추가 권장.

### `schema.prisma` 권장 패치 (production용)

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")     // ← 추가
  extensions = [vector]
}
```

(현재 `schema.prisma`에는 directUrl이 없습니다. 배포 직전에 추가 후 push)

## 2. 첫 마이그레이션을 prisma migrate로 만들기

로컬에서 한 번:
```bash
cd next
npm run db:migrate -- --name init
```
→ `prisma/migrations/<timestamp>_init/migration.sql` 생성됨. 이걸 git에 commit.

이후 production은 `prisma migrate deploy`가 처리.

### pgvector 컬럼 SQL을 마이그레이션에 포함

`prisma db push`는 `Unsupported` 컬럼이 없어서 vector 컬럼을 만들지 않습니다. 별도 SQL이 필요해요.

방법 A — 마이그레이션 파일에 raw SQL 추가:
```bash
# init 마이그레이션 SQL 파일 끝에 다음을 append
cat prisma/vector.sql >> prisma/migrations/<timestamp>_init/migration.sql
```

방법 B — separate migration:
```bash
mkdir prisma/migrations/000_add_vector
cp prisma/vector.sql prisma/migrations/000_add_vector/migration.sql
```

`prisma migrate deploy`가 모든 미적용 마이그레이션을 순서대로 실행합니다.

## 3. Resend 도메인 설정 (옵션)

- 처음에는 `onboarding@resend.dev` (Resend 샌드박스 발신자) 사용 가능 — 가입한 본인 이메일에만 수신 가능
- 본격 운영은 자체 도메인 + DNS DKIM/SPF 인증 → 모든 사용자에게 발송 가능
- Resend Dashboard → Domains → 도메인 등록 → DNS 레코드 적용

## 4. Vercel 프로젝트 생성

1. https://vercel.com → "New Project" → GitHub repo 연결
2. **Root Directory** 지정: `next` (또는 `/next`)
3. **Framework Preset**: Next.js (자동 감지)
4. **Build Command**: `npm run vercel-build` (위에서 추가한 것)
5. **Environment Variables** 등록:

   | 키 | 값 |
   |---|---|
   | `DATABASE_URL` | Neon Pooled connection string |
   | `DIRECT_URL` | Neon Direct connection string |
   | `AUTH_SECRET` | `openssl rand -base64 32` 결과 |
   | `AUTH_URL` | `https://<your-domain>.vercel.app` |
   | `AUTH_TRUST_HOST` | `true` |
   | `RESEND_API_KEY` | Resend 콘솔의 API key |
   | `RESEND_FROM_EMAIL` | `Princessgram <noreply@yourdomain.com>` 또는 샌드박스 |
   | `APP_BASE_URL` | `https://<your-domain>.vercel.app` |
   | `ADMIN_EMAILS` | 본인 이메일 (관리자 페이지 접근용) |

6. Deploy

## 5. 첫 배포 후 한 번만

- 시드 데이터(공주 5명) 넣기. Vercel CLI 또는 로컬에서:
  ```bash
  DATABASE_URL="<neon-pooled-url>" npm run db:seed
  ```

## 6. 도메인 연결 (옵션)

- Vercel → Project → Settings → Domains → 자체 도메인 추가
- 위 `AUTH_URL`, `APP_BASE_URL` 환경변수도 같이 갱신
- Redeploy

## 7. 운영 시 비용 예상

| 항목 | 비용 |
|---|---|
| Vercel Hobby plan | $0 (개인 프로젝트) |
| Neon Free Tier | $0 (DB 0.5GB, 무제한 분기) |
| Resend | $0 (월 3000건 무료) |
| OpenAI (옵션 A) | **사용자 부담** — 운영자 $0 |

규모 커지면 단계적 유료 전환:
- Vercel Pro $20/월 (트래픽↑, 빌드 시간↑)
- Neon Pro $19/월 (DB 용량↑, autoscale)
- Resend Pro $20/월 (월 50,000건)

## 8. 배포 후 점검 체크리스트

- [ ] `/signup` → 회원가입 → 이메일 수신 (Resend 대시보드에서 발송 로그 확인)
- [ ] `/verify-email` → 코드 입력 → DB의 `User.emailVerified` 채워졌는지 (Neon SQL editor로 확인)
- [ ] `/login` 로그인 → 쿠키 발급
- [ ] `/app` 진입 → 기존 SNS UI 작동, 콘솔에 `synced from /api/princesses` 로그
- [ ] 공주 게시글 좋아요 → DB `CharPostLike` row 증가
- [ ] DM 보내기 → DB `DirectMessage` row + `/me/feed`에 표시
- [ ] `/admin/princesses` → ADMIN_EMAILS에 등록된 계정만 접근 가능
- [ ] `/settings/intimacy`, `/settings/memory`, `/me/feed` 정상 동작

## 9. 트러블슈팅

**문제**: `prisma migrate deploy` 실패 (pgvector 없음)
**해결**: Neon SQL editor에서 `CREATE EXTENSION IF NOT EXISTS vector;` 먼저 실행

**문제**: 로그인 후 `/app`에서 401
**해결**: `AUTH_URL`, `AUTH_TRUST_HOST` 환경변수 확인. Vercel custom domain이면 `AUTH_URL`을 그쪽으로 맞춰야 함

**문제**: `Resend` 401 또는 발송 안 됨
**해결**: API key 형식 (`re_...`) + Sender domain 인증 상태. 샌드박스라면 본인 이메일에만 받을 수 있음

**문제**: `Memory.embedding` 컬럼 없음 에러
**해결**: `prisma/vector.sql`을 마이그레이션에 포함했는지 확인. 없으면 Neon SQL editor에서 직접 실행
