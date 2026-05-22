import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

// 시각적으로 헷갈리는 문자 제외 (O, 0, I, 1)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function genInviteCode(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return out;
}

/**
 * unique 충돌 시 재시도. 최대 8번 시도 후 실패하면 throw.
 */
export async function genUniqueInviteCode(len = 6, maxAttempts = 8): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = genInviteCode(len);
    const exists = await prisma.princess.findUnique({ where: { inviteCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error("invite code generation exhausted");
}
