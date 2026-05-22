import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * MVP 업로드: 클라이언트가 미리 리사이즈한 data URL을 직접 받아
 * UploadedFile 테이블에 보관 후 동일 data URL을 다시 돌려준다.
 *
 * 본격 운영 시 S3/UploadThing/Supabase Storage로 교체. 이때 응답 url만 바꾸면 됨.
 */
const schema = z.object({
  dataUrl: z
    .string()
    .regex(/^data:(image\/(png|jpeg|jpg|webp)|video\/(mp4|webm|quicktime));base64,/i)
    .max(20_000_000)
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const ip = clientIp(req);
  const rl = rateLimit(`upload:${userId}:${ip}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "RateLimited" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  }

  const mimeMatch = parsed.data.dataUrl.match(/^data:((?:image|video)\/[a-z0-9.+-]+);base64,/i);
  const contentType = mimeMatch?.[1] ?? "image/jpeg";
  const size = parsed.data.dataUrl.length;

  const rec = await prisma.uploadedFile.create({
    data: { userId, url: parsed.data.dataUrl, contentType, size }
  });

  return NextResponse.json({
    ok: true,
    id: rec.id,
    url: rec.url, // 현재는 data URL. 미래 S3 전환 시 https URL로 자연스럽게 교체
    size,
    contentType
  });
}
