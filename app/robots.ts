import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

// robots.txt. The API proxy and the client-portal login redirect are not
// indexable content, so they are disallowed. `/*/login` covers every locale
// prefix (locale-prefixed routing, ADR-WEB-001). The sitemap URL is absolute and
// derived from the canonical site origin.
export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/*/login"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
