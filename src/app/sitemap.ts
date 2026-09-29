import type { MetadataRoute } from "next";
import { questions } from "@/lib/questions";

const siteUrl = "https://theoryprep.irish";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/practice", "/practice/learn", "/mock-test", "/questions", "/challenge", "/progress", "/test-ready", "/feedback", "/privacy", "/terms", "/support", "/theory-test-practice", "/irish-driving-theory-test", "/theory-test-questions", "/irish-theory-test-mock-test", "/irish-road-signs"];
  const questionRoutes = questions.map((question) => ({
    url: siteUrl + "/questions/" + question.id,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticRoutes.map((route) => ({
      url: siteUrl + route,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "/" ? 1 : 0.7,
    })),
    ...questionRoutes,
  ];
}
