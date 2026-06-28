import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * 업로드: 클라이언트가 미리 리사이즈한 data URL을 받아 Supabase Storage(uploads 버킷)에
 * 저장하고, public URL을 돌려준다. 메타데이터는 UploadedFile 테이블에 기록한다.
 * 응답 형식({ ok, id, url, size, contentType })은 기존과 동일하다.
 *
 * 사전 준비: Supabase 콘솔에서 public 버킷 `uploads` 생성.
 */
const BUCKET = "uploads";

const schema = z.object({
  dataUrl: z
    .string()
    .regex(/^data:(image\/(png|jpeg|jpg|webp)|video\/(mp4|webm|quicktime));base64,/i)
    .max(28_000_000) // base64는 원본보다 ~33% 크다. 원본 20MB 기준 여유.
});

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov"
};

export async function POST(req: Request) {
  const authUser = await getSessionUser();
  const userId = authUser?.id;
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

  const mimeMatch = parsed.data.dataUrl.match(/^data:((?:image|video)\/[a-z0-9.+-]+);base64,(.*)$/is);
  if (!mimeMatch) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  const contentType = mimeMatch[1].toLowerCase();
  const base64 = mimeMatch[2];
  const buffer = Buffer.from(base64, "base64");
  const size = buffer.length;

  const ext = EXT_BY_TYPE[contentType] ?? "bin";
  const rand = Math.random().toString(36).slice(2, 10);
  const objectPath = `${userId}/${Date.now()}-${rand}.${ext}`;

  const supabase = createSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, buffer, { contentType, upsert: false });
  if (uploadError) {
    return NextResponse.json({ ok: false, error: "UploadFailed" }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const url = pub.publicUrl;

  const rec = await prisma.uploadedFile.create({
    data: { userId, url, contentType, size }
  });

  return NextResponse.json({
    ok: true,
    id: rec.id,
    url,
    size,
    contentType
  });
}
