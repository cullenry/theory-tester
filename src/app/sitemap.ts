import type { MetadataRoute } from "next";
import { questions } from "@/lib/questions";
import { seoTopicPages } from "@/lib/seo-topics";

const siteUrl = "https://theoryprep.irish";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/practice", "/practice/learn", "/mock-test", "/practice/flashcards", "/questions", "/challenge", "/feedback", "/privacy", "/terms", "/support", "/theory-test-practice", "/irish-driving-theory-test", "/theory-test-questions", "/irish-theory-test-mock-test", "/irish-road-signs", "/theory-test-topics"];

  const topicRoutes = seoTopicPages.map((topic) => ({
    url: siteUrl + "/theory-test-topics/" + topic.slug,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const questionRoutes = questions.map((question) => ({
    url: siteUrl + "/questions/" + question.id,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticRoutes.map((route) => ({
      url: siteUrl + route,
      changeFrequency: "weekly" as const,
      priority: route === "/" ? 1 : 0.7,
    })),
    ...topicRoutes,
    ...questionRoutes,
  ];
}
