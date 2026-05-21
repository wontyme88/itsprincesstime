import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { searchMemory, isValidEmbedding, EMBED_DIM } from "@/lib/memory";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  princessId: z.string().min(1).max(64).optional(),
  kind: z.string().min(1).max(40).optional(),
  embedding: z.array(z.number()).length(EMBED_DIM),
  limit: z.number().int().min(1).max(20).optional()
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const ip = clientIp(req);
  const rl = rateLimit(`mem:search:${userId}:${ip}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success || !isValidEmbedding(parsed.data.embedding)) {
    return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  }

  try {
    const rows = await searchMemory({
      userId,
      princessId: parsed.data.princessId ?? null,
      kind: parsed.data.kind,
      embedding: parsed.data.embedding,
      limit: parsed.data.limit
    });
    return NextResponse.json({
      ok: true,
      hits: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        princessId: r.princessId,
        text: r.text,
        createdAt: r.createdAt,
        distance: Number(r.distance)
      }))
    });
  } catch (e) {
    console.error("[memory/search]", e);
    return NextResponse.json({ ok: false, error: "SearchFailed" }, { status: 500 });
  }
}
