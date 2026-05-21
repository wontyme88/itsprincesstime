-- pgvector 확장 + Memory.embedding 컬럼 + HNSW 인덱스
-- prisma db push 후 한 번 실행: npm run db:vector

CREATE EXTENSION IF NOT EXISTS vector;

-- 컬럼이 없으면 추가 (text-embedding-3-small = 1536 차원)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Memory' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE "Memory" ADD COLUMN embedding vector(1536);
  END IF;
END $$;

-- HNSW 인덱스 (코사인 거리)
CREATE INDEX IF NOT EXISTS memory_embedding_idx
  ON "Memory"
  USING hnsw (embedding vector_cosine_ops);
