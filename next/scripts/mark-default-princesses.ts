/**
 * 기본 5명의 공주에 isDefault=true 표시 + 기존 사용자에게 UserPrincessRelation 백필.
 * 한 번만 실행: npx tsx scripts/mark-default-princesses.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEFAULT_IDS = ["momo__o", "ruby_", "lily_princess", "sora_diary", "pearl_diary"];

async function main() {
  console.log(`[default] marking ${DEFAULT_IDS.length} princesses as default`);
  await prisma.princess.updateMany({
    where: { id: { in: DEFAULT_IDS } },
    data: { isDefault: true }
  });

  const users = await prisma.user.findMany({ select: { id: true } });
  console.log(`[default] backfilling relations for ${users.length} users`);
  for (const u of users) {
    for (const pid of DEFAULT_IDS) {
      await prisma.userPrincessRelation.upsert({
        where: { userId_princessId: { userId: u.id, princessId: pid } },
        update: {},
        create: { userId: u.id, princessId: pid }
      });
    }
  }
  console.log(`[default] done`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
