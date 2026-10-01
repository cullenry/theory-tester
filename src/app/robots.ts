import type { MetadataRoute } from "next";

const siteUrl = "https://theoryprep.irish";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: [
        "/login",
        "/signup",
        "/progress",
        "/mistakes",
        "/settings",
        "/forgot-password",
        "/reset-password",
        "/auth",
        "/test-ready",
      ] },
    ],
    sitemap: siteUrl + "/sitemap.xml",
  };
}
