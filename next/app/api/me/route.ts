import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/zod-schemas";

const profileSelect = {
  username: true,
  princessName: true,
  birthDate: true,
  birthTime: true,
  mbti: true,
  avatarUrl: true,
  ipCode: true,
  interests: true
} as const;

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      profile: { select: profileSelect }
    }
  });
  return NextResponse.json({ ok: true, user });
}

export async function PATCH(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "InvalidJson" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const profile = await prisma.userProfile.update({
    where: { userId },
    data: {
      ...(data.princessName !== undefined && { princessName: data.princessName }),
      ...(data.birthDate !== undefined && {
        birthDate: data.birthDate ? new Date(data.birthDate) : null
      }),
      ...(data.birthTime !== undefined && { birthTime: data.birthTime ?? null }),
      ...(data.mbti !== undefined && { mbti: data.mbti ?? null }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null }),
      ...(data.interests !== undefined && { interests: data.interests })
    },
    select: profileSelect
  });

  return NextResponse.json({ ok: true, profile });
}
