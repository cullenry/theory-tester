import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuestionDetail } from "@/components/question-detail";
import { getQuestionById, questions } from "@/lib/questions";

type DetailPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const question = getQuestionById(Number(id));

  if (!question) {
    return {
      title: "Question not found",
      description: "Browse Irish driving theory test questions on TheoryPrep.",
    };
  }

  const category = question.taxonomy.category;
  const categoryPhrase = category ? ` from ${category.toLowerCase()}` : "";
  const questionTitle = question.question.trim();
  const description = `Practice Irish driving theory test question #${question.id}${categoryPhrase}. See the answer and explanation: ${questionTitle}`.slice(0, 158);

  return {
    title: `Irish Theory Test Question ${question.id}: ${questionTitle.slice(0, 62)}`,
    description,
    alternates: { canonical: `/questions/${question.id}` },
    openGraph: {
      title: `Irish Theory Test Question ${question.id}: ${questionTitle.slice(0, 62)}`,
      description,
      url: `/questions/${question.id}`,
      siteName: "TheoryPrep",
      type: "website",
    },
  };
}

export default async function QuestionDetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const question = getQuestionById(Number(id));
  if (!question) notFound();
  const index = questions.findIndex((item) => item.id === question.id);
  const previousId = questions[index - 1]?.id ?? null;
  const nextId = questions[index + 1]?.id ?? null;

  return <QuestionDetail question={question} index={index} previousId={previousId} nextId={nextId} />;
}
