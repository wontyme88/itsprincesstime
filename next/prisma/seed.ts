import { PrismaClient } from "@prisma/client";
import { PRINCESSES } from "../lib/princess-personality";

const prisma = new PrismaClient();

async function main() {
  for (const p of PRINCESSES) {
    await prisma.princess.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        displayName: p.displayName,
        // 구조화된 personality 전체를 JSON으로 저장 (id/displayName 중복 필드는 제거)
        personality: stripIdentityFields(p)
      },
      update: {
        displayName: p.displayName,
        personality: stripIdentityFields(p)
      }
    });
    console.log(`[seed] ${p.id} (${p.displayName}) upserted`);
  }
  console.log(`[seed] ${PRINCESSES.length} princesses ready`);
}

function stripIdentityFields(p: (typeof PRINCESSES)[number]) {
  const { id: _id, displayName: _name, ...rest } = p;
  return rest;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
