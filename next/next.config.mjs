/** @type {import('next').NextConfig} */
const nextConfig = {
  // 모든 라우트에 trailing slash 적용 (legacy HTML의 상대 URL 해석을 위해 /app/는 슬래시 유지)
  trailingSlash: true,

  async rewrites() {
    return [
      { source: "/app/", destination: "/legacy/index.html" },
      { source: "/app/assets/:path*", destination: "/legacy/assets/:path*" }
    ];
  }
};

export default nextConfig;
