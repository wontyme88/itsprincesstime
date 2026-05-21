/**
 * pgvector Memory 유틸.
 * 클라이언트가 OpenAI embeddings로 만든 vector(1536)를 그대로 받아 저장/검색한다.
 * 서버는 OpenAI 키를 절대 안 가짐 — 옵션 A.
 */
import { prisma } from "@/lib/prisma";

export const EMBED_DIM = 1536;

export function isValidEmbedding(v: unknown): v is number[] {
  return (
    Array.isArray(v) &&
    v.length === EMBED_DIM &&
    v.every((x) => typeof x === "number" && Number.isFinite(x))
  );
}

function vectorLiteral(v: number[]): string {
  // pgvector 입력 포맷: '[0.1,0.2,...]'
  return "[" + v.join(",") + "]";
}

export type MemoryRow = {
  id: string;
  userId: string;
  princessId: string | null;
  kind: string;
  text: string;
  meta: unknown;
  createdAt: Date;
};

/**
 * 메모리 1건 저장. text + embedding 둘 다 필요.
 */
export async function saveMemory(input: {
  userId: string;
  princessId: string | null;
  kind: string;
  text: string;
  embedding: number[];
  meta?: Record<string, unknown>;
}): Promise<{ id: string }> {
  const id = "mem_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const vec = vectorLiteral(input.embedding);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Memory" ("id","userId","princessId","kind","text","meta","embedding","createdAt")
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::vector,NOW())`,
    id,
    input.userId,
    input.princessId,
    input.kind,
    input.text,
    JSON.stringify(input.meta ?? {}),
    vec
  );
  return { id };
}

/**
 * 코사인 유사도로 top-K 검색.
 */
export async function searchMemory(input: {
  userId: string;
  princessId?: string | null;
  kind?: string;
  embedding: number[];
  limit?: number;
}): Promise<Array<MemoryRow & { distance: number }>> {
  const limit = Math.min(20, Math.max(1, input.limit ?? 5));
  const vec = vectorLiteral(input.embedding);
  // princessId가 명시되면 그 공주 메모리 + 공통 메모리(princessId IS NULL) 둘 다 후보
  const princessFilter = input.princessId
    ? `AND ("princessId" = $3 OR "princessId" IS NULL)`
    : ``;
  const kindFilter = input.kind ? `AND "kind" = $4` : ``;

  const params: unknown[] = [input.userId, vec];
  if (input.princessId) params.push(input.princessId);
  else params.push(null); // 자리 홀더 유지
  if (input.kind) params.push(input.kind);
  else params.push(null);

  // 동적 파라미터: $3은 princessId, $4는 kind. NULL이면 필터가 빠지므로 인자도 쓰임 없음.
  const sql = `
    SELECT id, "userId", "princessId", kind, text, meta, "createdAt",
           (embedding <=> $2::vector) AS distance
    FROM "Memory"
    WHERE "userId" = $1
      ${princessFilter}
      ${kindFilter}
    ORDER BY embedding <=> $2::vector ASC
    LIMIT ${limit}
  `;
  const rows = await prisma.$queryRawUnsafe<
    Array<MemoryRow & { distance: number }>
  >(sql, ...params);
  return rows;
}

export async function listMemories(input: {
  userId: string;
  limit?: number;
  before?: Date;
}) {
  return prisma.memory.findMany({
    where: { userId: input.userId, ...(input.before ? { createdAt: { lt: input.before } } : {}) },
    orderBy: { createdAt: "desc" },
    take: Math.min(100, input.limit ?? 50)
  });
}

export async function deleteMemory(id: string, userId: string) {
  return prisma.memory.deleteMany({ where: { id, userId } });
}
