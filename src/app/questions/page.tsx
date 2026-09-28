import type { Metadata } from "next";
import { QuestionBrowser } from "@/components/question-browser";
import { questions } from "@/lib/questions";

export const metadata: Metadata = { title: "Question Library", description: "Search and browse Irish driving theory test questions by category." };

export default function QuestionsPage() {
  return <main className="app-main"><div className="page-shell browser-shell"><div className="page-heading"><div><p className="eyebrow">The full library</p><h1>Question browser</h1></div><span className="test-chip">{questions.length} questions</span></div><QuestionBrowser /></div></main>;
}