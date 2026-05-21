import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import EditorClient from "./editor";

export default async function AdminPrincessEditPage({
  params
}: {
  params: { id: string };
}) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    if (guard.status === 401) redirect(`/login?next=/admin/princesses/${params.id}`);
    return (
      <main className="px-5 py-10">
        <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">관리자 권한이 없어요.</div>
      </main>
    );
  }

  const princess = await prisma.princess.findUnique({ where: { id: params.id } });
  if (!princess) notFound();

  return (
    <main className="px-5 py-8">
      <div className="mb-4 flex items-center gap-2 text-xs text-pink-700">
        <Link href="/admin/princesses" className="hover:underline">← 목록</Link>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-pink-700">
        {princess.displayName} <span className="text-sm text-pink-700/60">@{princess.id}</span>
      </h1>
      <p className="mb-5 text-xs text-pink-900/60">JSON으로 personality 필드를 직접 편집해요. 저장 시 부분 머지로 반영됩니다.</p>
      <EditorClient
        id={princess.id}
        initialDisplayName={princess.displayName}
        initialPersonality={JSON.stringify(princess.personality ?? {}, null, 2)}
      />
    </main>
  );
}
