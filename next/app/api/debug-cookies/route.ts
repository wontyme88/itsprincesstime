import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const all = cookies().getAll();
  return NextResponse.json({
    ok: true,
    count: all.length,
    cookieNames: all.map((c) => c.name),
    secretSet: !!process.env.AUTH_SECRET,
    authUrl: process.env.AUTH_URL
  });
}
