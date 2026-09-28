import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuestionDetail } from "@/components/question-detail";
import { getQuestionById, questions } from "@/lib/questions";

type DetailPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const question = getQuestionById(Number(id));
  return question
    ? {
        title: `Question ${question.id}: ${question.question.slice(0, 70)}`,
        description: `${question.question} — answer and explanation for Irish driving theory practice.`,
        alternates: { canonical: `/questions/${question.id}` },
      }
    : { title: "Question not found", description: "Browse Irish driving theory questions." };
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