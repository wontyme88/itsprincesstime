import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge 미들웨어: 세션 쿠키 존재 여부만 확인.
 * (실제 JWT 검증은 각 /api/* 라우트에서 auth()로 수행됨)
 *
 * 이렇게 단순화한 이유: Auth.js v5의 JWE 디코딩이 next-auth/jwt getToken과
 * 잘 안 맞는 경우가 있어 redirect loop 발생. 쿠키 유무로 1차 가드만 한다.
 */
export function middleware(req: NextRequest) {
  const cookie =
    req.cookies.get("__Secure-authjs.session-token") ||
    req.cookies.get("authjs.session-token");

  if (!cookie?.value) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app", "/app/:path*"]
};
