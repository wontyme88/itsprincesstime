import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const threads = await prisma.directMessageThread.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });

  return NextResponse.json({
    ok: true,
    threads: threads.map((t) => ({
      princessId: t.princessId,
      unread: t.unread,
      updatedAt: t.updatedAt,
      lastMessage: t.messages[0]
        ? { fromMe: t.messages[0].fromMe, text: t.messages[0].text, createdAt: t.messages[0].createdAt }
        : null
    }))
  });
}
