import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.malappuramnikah.com";

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date("2026-08-22T13:16:27+05:30"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date("2026-08-17T04:14:37+05:30"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/matches`,
      lastModified: new Date("2026-08-05T00:46:57+05:30"),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/success-stories`,
      lastModified: new Date("2026-08-17T04:14:37+05:30"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/save-the-date/demo-user-invitation`,
      lastModified: new Date("2026-07-04T22:19:26+05:30"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2026-08-17T06:45:27+05:30"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2026-08-17T06:45:27+05:30"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: new Date("2026-08-22T13:25:47+05:30"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
