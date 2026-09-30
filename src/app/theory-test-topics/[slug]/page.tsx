import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLandingPage } from "@/components/seo-landing-page";
import { seoTopicPages } from "@/lib/seo-topics";

type TopicPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return seoTopicPages.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = seoTopicPages.find((item) => item.slug === slug);

  if (!topic) {
    return {
      title: "Theory Test Topic Not Found",
      description: "Browse Irish driving theory test practice topics on TheoryPrep.",
    };
  }

  return {
    title: `${topic.title} 2026`,
    description: topic.description,
    alternates: { canonical: `/theory-test-topics/${topic.slug}` },
    openGraph: {
      title: topic.title,
      description: topic.description,
      url: `/theory-test-topics/${topic.slug}`,
      siteName: "TheoryPrep",
      type: "website",
    },
  };
}

export default async function TheoryTestTopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const topic = seoTopicPages.find((item) => item.slug === slug);
  if (!topic) notFound();

  return (
    <SeoLandingPage
      eyebrow={topic.eyebrow}
      title={topic.title}
      intro={topic.intro}
      primaryAction={{
        href: `/practice?category=${encodeURIComponent(topic.category)}`,
        label: "Practise this topic",
        description: "",
      }}
      secondaryAction={{ href: "/questions", label: "Browse all questions", description: "" }}
      sections={topic.sections}
      canonicalPath={`/theory-test-topics/${topic.slug}`}
      breadcrumbParent={{ name: "Irish Theory Test Topics", path: "/theory-test-topics" }}
      questionCategory={topic.category}
      sampleHeading={`Questions about ${topic.category.toLowerCase()}.`}
      sampleDescription={`Practise examples from TheoryPrep's ${topic.category.toLowerCase()} category.`}
    />
  );
}
