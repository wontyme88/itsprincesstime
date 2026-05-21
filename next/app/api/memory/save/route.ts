import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { saveMemory, isValidEmbedding, EMBED_DIM } from "@/lib/memory";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  princessId: z.string().min(1).max(64).nullable().optional(),
  kind: z.string().min(1).max(40),
  text: z.string().min(1).max(8000),
  embedding: z.array(z.number()).length(EMBED_DIM),
  meta: z.record(z.any()).optional()
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const ip = clientIp(req);
  const rl = rateLimit(`mem:save:${userId}:${ip}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success || !isValidEmbedding(parsed.data.embedding)) {
    return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  }

  try {
    const { id } = await saveMemory({
      userId,
      princessId: parsed.data.princessId ?? null,
      kind: parsed.data.kind,
      text: parsed.data.text,
      embedding: parsed.data.embedding,
      meta: parsed.data.meta
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("[memory/save]", e);
    return NextResponse.json({ ok: false, error: "SaveFailed" }, { status: 500 });
  }
}
