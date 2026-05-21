import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MemoryListClient from "./client";

export default async function MemoryPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login?next=/settings/memory");

  const rows = await prisma.memory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const items = rows.map((r) => ({
    id: r.id,
    princessId: r.princessId,
    kind: r.kind,
    text: r.text,
    createdAt: r.createdAt.toISOString()
  }));

  return (
    <main className="px-5 py-8">
      <div className="mb-4 flex items-center gap-2 text-xs text-pink-700">
        <Link href="/feed" className="hover:underline">← 피드로</Link>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-pink-700">내 AI 메모리</h1>
      <p className="mb-5 text-xs text-pink-900/60">
        공주들이 너를 더 잘 기억할 수 있도록 저장된 메모리들이에요. 삭제하면 영구 제거돼요.
      </p>
      <MemoryListClient initialItems={items} />
    </main>
  );
}
