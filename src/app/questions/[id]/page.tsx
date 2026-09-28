import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuestionDetail } from "@/components/question-detail";
import { getQuestionById, questions } from "@/lib/questions";

type DetailPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const question = getQuestionById(Number(id));
  return { title: question ? `Question ${question.id}` : "Question not found", description: question?.question ?? "Browse Irish driving theory questions." };
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