-- AlterTable
ALTER TABLE "PrincessPost"
  ADD COLUMN "emoji" TEXT,
  ADD COLUMN "comments" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- DropIndex
DROP INDEX IF EXISTS "PrincessPost_princessId_createdAt_idx";
DROP INDEX IF EXISTS "PrincessPost_createdAt_idx";

-- CreateIndex
CREATE INDEX "PrincessPost_princessId_position_idx" ON "PrincessPost"("princessId", "position");
