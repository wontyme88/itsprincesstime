import { NextResponse, type NextRequest } from "next/server";

// 인증 없이 접근 가능한 경로들 (명시적 화이트리스트)
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password"
];

function isPublicPath(path: string): boolean {
  const normalized = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
  return PUBLIC_PATHS.includes(normalized);
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // public 경로는 미들웨어 통과 (이중 안전장치)
  if (isPublicPath(path)) return NextResponse.next();
  if (path.startsWith("/api/")) return NextResponse.next();
  if (path.startsWith("/_next/")) return NextResponse.next();
  if (path.startsWith("/legacy/")) return NextResponse.next();

  // 보호 대상 (/app/*)만 세션 쿠키 확인
  const cookie =
    req.cookies.get("__Secure-authjs.session-token") ||
    req.cookies.get("authjs.session-token");

  if (!cookie?.value) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  // /app, /app/, /app/* 모두 가드
  matcher: ["/app/:path*", "/app"]
};
