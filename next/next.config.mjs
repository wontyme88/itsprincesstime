/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // /app → /app/  (trailing slash so relative URLs in legacy index.html resolve correctly)
      { source: "/app", destination: "/app/", permanent: false }
    ];
  },
  async rewrites() {
    return [
      { source: "/app/", destination: "/legacy/index.html" },
      { source: "/app/assets/:path*", destination: "/legacy/assets/:path*" }
    ];
  }
};

export default nextConfig;
