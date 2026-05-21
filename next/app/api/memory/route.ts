import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listMemories, deleteMemory } from "@/lib/memory";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const rows = await listMemories({ userId });
  return NextResponse.json({
    ok: true,
    memories: rows.map((r) => ({
      id: r.id,
      princessId: r.princessId,
      kind: r.kind,
      text: r.text,
      createdAt: r.createdAt
    }))
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "MissingId" }, { status: 400 });

  const r = await deleteMemory(id, userId);
  return NextResponse.json({ ok: true, deleted: r.count });
}
