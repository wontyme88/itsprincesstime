import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js 설정 (PrismaAdapter 없음).
 * 미들웨어에서 import해서 사용. lib/auth.ts가 이걸 확장해서 providers/adapter를 더한다.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-email",
    error: "/login"
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isAppRoute = path === "/app" || path.startsWith("/app/");
      if (isAppRoute) return isLoggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) token.uid = (user as { id: string }).id;
      return token;
    },
    session({ session, token }) {
      if (token.uid && session.user) {
        (session.user as { id?: string }).id = token.uid as string;
      }
      return session;
    }
  },
  providers: []
};
