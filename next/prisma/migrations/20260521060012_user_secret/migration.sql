-- CreateTable
CREATE TABLE "UserSecret" (
    "userId"                TEXT NOT NULL,
    "openaiApiKeyEncrypted" TEXT,
    "openaiKeyIv"           TEXT,
    "openaiKeyTag"          TEXT,
    "updatedAt"             TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSecret_pkey" PRIMARY KEY ("userId")
);
