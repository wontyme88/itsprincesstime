import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function intimacyLevel(score: number): { label: string; color: string; pct: number } {
  // 0~100 정도를 기본 스케일로. 누적이라 클 수 있어 100+는 그대로 표시.
  if (score <= 0) return { label: "낯섦", color: "bg-gray-300", pct: Math.max(0, score) };
  if (score < 20) return { label: "안녕", color: "bg-pink-200", pct: (score / 100) * 100 };
  if (score < 50) return { label: "친구", color: "bg-pink-300", pct: (score / 100) * 100 };
  if (score < 100) return { label: "친한 친구", color: "bg-pink-400", pct: (score / 100) * 100 };
  if (score < 200) return { label: "베프", color: "bg-pink-500", pct: 100 };
  return { label: "절친", color: "bg-rose-500", pct: 100 };
}

export default async function IntimacyPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login?next=/settings/intimacy");

  const [princesses, relations] = await Promise.all([
    prisma.princess.findMany({ orderBy: { id: "asc" } }),
    prisma.userPrincessRelation.findMany({ where: { userId } })
  ]);
  const relByPid = new Map(relations.map((r) => [r.princessId, r]));

  const rows = princesses
    .map((p) => {
      const meta = (p.personality ?? {}) as { emojis?: string[]; vibe?: string; tagline?: string };
      const rel = relByPid.get(p.id);
      return {
        id: p.id,
        name: p.displayName,
        emoji: meta.emojis?.[0] ?? "👑",
        vibe: meta.vibe ?? "",
        intimacy: rel?.intimacy ?? 0,
        lastInteractedAt: rel?.lastInteractedAt ?? null
      };
    })
    .sort((a, b) => b.intimacy - a.intimacy);

  return (
    <main className="px-5 py-8">
      <div className="mb-4 flex items-center gap-2 text-xs text-pink-700">
        <Link href="/feed" className="hover:underline">← 피드로</Link>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-pink-700">공주별 친밀도</h1>
      <p className="mb-5 text-xs text-pink-900/60">
        좋아요·댓글·답글·DM 같은 활동이 쌓일수록 점수가 올라가요.
      </p>

      <div className="space-y-3">
        {rows.map((r, i) => {
          const lv = intimacyLevel(r.intimacy);
          return (
            <div key={r.id} className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{r.emoji}</span>
                  <div>
                    <div className="text-sm font-bold text-pink-900">
                      {i === 0 && r.intimacy > 0 && <span className="mr-1">👑</span>}
                      {r.name} <span className="ml-1 text-xs text-pink-700/60">@{r.id}</span>
                    </div>
                    <div className="text-[11px] text-pink-900/60">{r.vibe}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-pink-700">{r.intimacy}</div>
                  <div className="text-[10px] text-pink-900/50">{lv.label}</div>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-pink-50">
                <div
                  className={`h-full ${lv.color} transition-all`}
                  style={{ width: `${Math.min(100, Math.max(0, lv.pct))}%` }}
                />
              </div>
              {r.lastInteractedAt && (
                <div className="mt-1.5 text-[10px] text-pink-900/40">
                  마지막 상호작용: {new Date(r.lastInteractedAt).toLocaleString("ko-KR")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-pink-50/60 p-4 text-[11px] text-pink-900/70">
        <div className="mb-1.5 font-semibold">점수 계산</div>
        <ul className="space-y-0.5">
          <li>좋아요 +2 · 댓글 +4 · 답글 +5</li>
          <li>DM 보내기 +6 · 받기 +1</li>
          <li>경고 모달 "예" +1 · "아니오" −15 · 부적절 발언 −5</li>
        </ul>
      </div>
    </main>
  );
}
