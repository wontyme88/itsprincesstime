import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { princessId: string } }
) {
  const authUser = await getSessionUser();
  const userId = authUser?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  await prisma.directMessageThread.updateMany({
    where: { userId, princessId: params.princessId },
    data: { unread: 0 }
  });
  return NextResponse.json({ ok: true });
}
