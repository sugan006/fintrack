import type { NextConfig } from "next";

// Where the ASP.NET Core API runs. The browser calls /api/... on this site, and Next.js
// forwards the request to the API server-side. This avoids CORS and lets an HTTPS frontend
// use an HTTP-only API without the browser blocking it as mixed content.
const apiUrl = process.env.API_URL ?? "http://localhost:5249";

const nextConfig: NextConfig = {
    async rewrites() {
        return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
    },
};

export default nextConfig;