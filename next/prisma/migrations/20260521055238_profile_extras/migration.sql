-- AlterTable
ALTER TABLE "UserProfile"
  ADD COLUMN "birthTime" TEXT,
  ADD COLUMN "mbti"      TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "ipCode"    TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_ipCode_key" ON "UserProfile"("ipCode");
