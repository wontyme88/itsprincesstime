/*
  Warnings:

  - You are about to drop the column `embedding` on the `Memory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[inviteCode]` on the table `Princess` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "memory_embedding_idx";

-- AlterTable
ALTER TABLE "Memory" DROP COLUMN "embedding";

-- AlterTable
ALTER TABLE "Princess" ADD COLUMN     "inviteCode" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "themeColor" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Princess_inviteCode_key" ON "Princess"("inviteCode");
