import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FriendChallenge } from "@/components/friend-challenge";
import { decodeFriendChallenge } from "@/lib/challenge-share";
import { getQuestionById, type Question } from "@/lib/questions";

type ChallengePageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ChallengePageProps): Promise<Metadata> {
  const { id } = await params;
  const payload = decodeFriendChallenge(id);

  return {
    title: payload ? `Challenge from ${payload.name}` : "TheoryPrep Challenge",
    description: payload
      ? `Take ${payload.name}'s 10-question Irish driving theory test challenge on TheoryPrep and try to beat their score.`
      : "Take a shareable Irish driving theory test challenge on TheoryPrep.",
    robots: { index: false, follow: false },
  };
}

export default async function FriendChallengePage({ params }: ChallengePageProps) {
  const { id } = await params;
  const payload = decodeFriendChallenge(id);
  if (!payload) notFound();

  const challengeQuestions = payload.questionIds
    .map((questionId) => getQuestionById(questionId))
    .filter((question): question is Question => Boolean(question));

  if (challengeQuestions.length !== payload.total) notFound();

  const challengeUrl = `https://theoryprep.irish/challenge/${id}`;

  return <FriendChallenge payload={payload} questions={challengeQuestions} challengeUrl={challengeUrl} />;
}
