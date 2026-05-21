import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const createSchema = z.object({
  text: z.string().min(1).max(4000),
  imageUrl: z.string().url().nullable().optional()
});

export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50", 10) || 50);

  const posts = await prisma.post.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      comments: { orderBy: { createdAt: "asc" } }
    }
  });

  return NextResponse.json({
    ok: true,
    posts: posts.map((p) => ({
      id: p.id,
      text: p.text,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt,
      comments: p.comments.map((c) => ({
        id: c.id,
        princessId: c.princessId,
        fromMe: !!c.authorUserId,
        parentId: c.parentId,
        text: c.text,
        createdAt: c.createdAt
      }))
    }))
  });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const ip = clientIp(req);
  const rl = rateLimit(`posts:create:${userId}:${ip}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });

  const post = await prisma.post.create({
    data: {
      userId,
      text: parsed.data.text,
      imageUrl: parsed.data.imageUrl ?? null
    }
  });
  return NextResponse.json({ ok: true, post: { id: post.id, createdAt: post.createdAt } });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "MissingId" }, { status: 400 });

  const r = await prisma.post.deleteMany({ where: { id, userId } });
  return NextResponse.json({ ok: true, deleted: r.count });
}
