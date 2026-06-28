-- Supabase Auth 전환: NextAuth/자체 인증용 테이블 및 컬럼 제거.
-- 비밀번호/세션/이메일 인증/비밀번호 재설정은 Supabase Auth(auth.users)가 관리한다.

-- NextAuth 어댑터 테이블
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;

-- 자체 OTP / 비밀번호 재설정 테이블
DROP TABLE IF EXISTS "OtpCode" CASCADE;
DROP TABLE IF EXISTS "PasswordResetToken" CASCADE;

-- 비밀번호 해시는 더 이상 보관하지 않음 (Supabase가 관리)
ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash";
