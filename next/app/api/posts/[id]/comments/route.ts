import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  text: z.string().min(1).max(2000),
  princessId: z.string().min(1).max(64).nullable().optional(),
  parentId: z.string().min(1).max(64).nullable().optional()
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const ip = clientIp(req);
  const rl = rateLimit(`pcmt:${userId}:${ip}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });

  // 본인 게시글에만 쓸 수 있음 (사용자/공주 댓글 모두)
  const post = await prisma.post.findFirst({ where: { id: params.id, userId } });
  if (!post) return NextResponse.json({ ok: false, error: "NotFound" }, { status: 404 });

  const c = await prisma.diaryComment.create({
    data: {
      postId: params.id,
      text: parsed.data.text,
      princessId: parsed.data.princessId ?? null,
      authorUserId: parsed.data.princessId ? null : userId,
      parentId: parsed.data.parentId ?? null
    }
  });
  return NextResponse.json({ ok: true, comment: { id: c.id, createdAt: c.createdAt } });
}
