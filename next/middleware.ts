import { NextResponse, type NextRequest } from "next/server";

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

  if (isPublicPath(path)) return NextResponse.next();
  if (path.startsWith("/api/")) return NextResponse.next();
  if (path.startsWith("/_next/")) return NextResponse.next();
  if (path.startsWith("/legacy/")) return NextResponse.next();

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
  matcher: ["/app/:path*", "/app"]
};
