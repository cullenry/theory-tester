import questionData from "@/data/questions.json";

export type QuestionType =
  | "roadSignOrImageIdentification"
  | "numericalOrCalculation"
  | "scenarioBased"
  | "definitionOrKnowledge"
  | "rulesOrProcedure";

export type TaxonomyConfidence = "high" | "medium" | "uncertain";

export type TaxonomyCandidate = {
  category: string;
  subcategory: string;
  score: number;
};

export type QuestionTaxonomy = {
  category: string | null;
  subcategory: string | null;
  confidence: TaxonomyConfidence;
  candidates: TaxonomyCandidate[];
};

export type Question = {
  id: number;
  question: string;
  answers: string[];
  correctAnswer: string | null;
  explanation: string | null;
  category: string | null;
  image: string | null;
  sourceUrl: string;
  taxonomy: QuestionTaxonomy;
  questionTypes: QuestionType[];
};

type QuestionDataset = {
  source: string;
  scrapedAt: string;
  count: number;
  questions: Question[];
};

const dataset = questionData as QuestionDataset;

export const questions = dataset.questions;
export const questionDatasetSource = dataset.source;
export const questionDatasetScrapedAt = dataset.scrapedAt;

export function getQuestionById(id: number): Question | undefined {
  return questions.find((question) => question.id === id);
}

export function getQuestionCategories(): string[] {
  return [...new Set(questions.map((question) => question.category?.trim() || "Uncategorized"))].sort((a, b) => a.localeCompare(b));
}

export function getRandomQuestions(count: number): Question[] {
  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getRandomQuestionsFromPool(pool: Question[], count: number): Question[] {
  const shuffled = [...pool];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, Math.max(0, Math.min(count, shuffled.length)));
}