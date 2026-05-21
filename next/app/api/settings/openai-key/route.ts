import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, maskKey } from "@/lib/crypto";

const putSchema = z.object({
  apiKey: z.string().min(20).max(300)
});

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const sec = await prisma.userSecret.findUnique({ where: { userId } });
  if (!sec?.openaiApiKeyEncrypted || !sec.openaiKeyIv || !sec.openaiKeyTag) {
    return NextResponse.json({ ok: true, hasKey: false, masked: null });
  }
  let masked: string | null = null;
  try {
    masked = maskKey(decrypt(sec.openaiApiKeyEncrypted, sec.openaiKeyIv, sec.openaiKeyTag));
  } catch {
    masked = "****";
  }
  return NextResponse.json({ ok: true, hasKey: true, masked, updatedAt: sec.updatedAt });
}

export async function PUT(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });

  let enc;
  try {
    enc = encrypt(parsed.data.apiKey);
  } catch (e) {
    console.error("[settings] encrypt failed", e);
    return NextResponse.json({ ok: false, error: "EncryptionUnavailable" }, { status: 500 });
  }

  await prisma.userSecret.upsert({
    where: { userId },
    create: {
      userId,
      openaiApiKeyEncrypted: enc.ciphertext,
      openaiKeyIv: enc.iv,
      openaiKeyTag: enc.tag
    },
    update: {
      openaiApiKeyEncrypted: enc.ciphertext,
      openaiKeyIv: enc.iv,
      openaiKeyTag: enc.tag
    }
  });
  return NextResponse.json({ ok: true, masked: maskKey(parsed.data.apiKey) });
}

export async function DELETE() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  await prisma.userSecret.updateMany({
    where: { userId },
    data: { openaiApiKeyEncrypted: null, openaiKeyIv: null, openaiKeyTag: null }
  });
  return NextResponse.json({ ok: true });
}
