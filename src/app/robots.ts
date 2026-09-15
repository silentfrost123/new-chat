import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/discover", "/character/", "/search", "/pricing", "/profile/"],
        disallow: [
          "/api/",
          "/admin/",
          "/chat/",
          "/chats",
          "/settings",
          "/notifications",
          "/favorites",
          "/following",
          "/history",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
