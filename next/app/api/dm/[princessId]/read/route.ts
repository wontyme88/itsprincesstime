import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { princessId: string } }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  await prisma.directMessageThread.updateMany({
    where: { userId, princessId: params.princessId },
    data: { unread: 0 }
  });
  return NextResponse.json({ ok: true });
}
