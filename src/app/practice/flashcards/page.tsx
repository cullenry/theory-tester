import { FlashcardSession } from "@/components/flashcard-session";

export const metadata = {
  title: "Theory Test Flashcards",
  description: "Study Irish car theory test questions with interactive flashcards, answer reveals and explanations.",
  alternates: { canonical: "/practice/flashcards" },
};

export default function FlashcardsPage() {
  return <FlashcardSession />;
}
