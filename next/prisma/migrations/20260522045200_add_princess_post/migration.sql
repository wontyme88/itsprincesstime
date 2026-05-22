-- AlterTable
ALTER TABLE "Princess" ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "bio" TEXT;

-- CreateTable
CREATE TABLE "PrincessPost" (
    "id" TEXT NOT NULL,
    "princessId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrincessPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrincessPost_princessId_createdAt_idx" ON "PrincessPost"("princessId", "createdAt");

-- CreateIndex
CREATE INDEX "PrincessPost_createdAt_idx" ON "PrincessPost"("createdAt");

-- AddForeignKey
ALTER TABLE "PrincessPost" ADD CONSTRAINT "PrincessPost_princessId_fkey" FOREIGN KEY ("princessId") REFERENCES "Princess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
