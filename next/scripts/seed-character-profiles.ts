/**
 * Legacy의 CHARACTER_PROFILES를 DB로 시드.
 * - Princess 5명 upsert (displayName/avatarUrl/bio 채움, personality는 유지)
 * - 각 공주의 PrincessPost를 모두 삭제 후 재삽입 (position 0..N-1, createdAt 순차 +1초)
 *
 * 실행: npx tsx scripts/seed-character-profiles.ts
 *
 * ⚠️ 기존 PrincessPost(관리자가 추가한 것 포함)는 모두 사라짐. 일회용.
 */
import { PrismaClient } from "@prisma/client";
import { LEGACY_CHARACTER_PROFILES, legacyAssetUrl } from "../lib/legacy-character-profiles";

const prisma = new PrismaClient();

async function main() {
  const entries = Object.entries(LEGACY_CHARACTER_PROFILES);
  console.log(`[seed] ${entries.length} princess profiles`);

  for (const [id, profile] of entries) {
    // Princess upsert (personality는 기존 값 유지하기 위해 update에서 빼고 create에서만 채움)
    const existing = await prisma.princess.findUnique({ where: { id } });
    if (existing) {
      await prisma.princess.update({
        where: { id },
        data: {
          displayName: profile.name,
          avatarUrl: legacyAssetUrl(profile.img),
          bio: profile.bio
        }
      });
    } else {
      await prisma.princess.create({
        data: {
          id,
          displayName: profile.name,
          avatarUrl: legacyAssetUrl(profile.img),
          bio: profile.bio,
          personality: {}
        }
      });
    }

    // 기존 게시글 제거 후 재삽입
    await prisma.princessPost.deleteMany({ where: { princessId: id } });

    const base = Date.now();
    for (let i = 0; i < profile.posts.length; i++) {
      const post = profile.posts[i]!;
      await prisma.princessPost.create({
        data: {
          princessId: id,
          imageUrl: legacyAssetUrl(post.image),
          emoji: post.emoji,
          text: post.caption,
          comments: post.comments as object,
          position: i,
          // createdAt은 position 순서로 약간씩 다르게
          createdAt: new Date(base + i * 1000)
        }
      });
    }

    console.log(`[seed] ${id}: avatar+bio + ${profile.posts.length} posts`);
  }

  console.log("[seed] done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
