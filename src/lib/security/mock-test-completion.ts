const FORMAT_COUNTS = {
  full: 40,
  "blitz-20": 20,
  "blitz-10": 10,
} as const;

const EXPECTED_KEYS = new Set(["formatId", "questionIds", "responses", "timeExpired"]);

type FormatId = keyof typeof FORMAT_COUNTS;

type QuestionForCompletion = {
  answers: readonly string[];
  correctAnswer: string | null;
};

export type ValidatedMockCompletion = {
  formatId: FormatId;
  expectedCount: number;
  timeExpired: boolean;
  correctCount: number;
  answeredCount: number;
  percentage: number;
};

export function validateMockTestCompletion(
  input: unknown,
  getQuestionById: (id: number) => QuestionForCompletion | undefined,
): ValidatedMockCompletion | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const body = input as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.length !== EXPECTED_KEYS.size || keys.some((key) => !EXPECTED_KEYS.has(key))) return null;

  if (
    typeof body.formatId !== "string" ||
    !Object.prototype.hasOwnProperty.call(FORMAT_COUNTS, body.formatId) ||
    typeof body.timeExpired !== "boolean" ||
    !Array.isArray(body.questionIds) ||
    !Array.isArray(body.responses)
  ) {
    return null;
  }

  const formatId = body.formatId as FormatId;
  const expectedCount = FORMAT_COUNTS[formatId];
  const questionIds = body.questionIds as unknown[];
  const responses = body.responses as unknown[];

  if (questionIds.length !== expectedCount || responses.length !== expectedCount) return null;

  const seenIds = new Set<number>();
  let correctCount = 0;
  let answeredCount = 0;

  for (let index = 0; index < expectedCount; index += 1) {
    const id = questionIds[index];
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 1 || seenIds.has(id)) return null;
    seenIds.add(id);

    const question = getQuestionById(id);
    if (!question) return null;

    const response = responses[index];
    if (response !== null && (typeof response !== "string" || !question.answers.includes(response))) {
      return null;
    }

    if (response !== null) {
      answeredCount += 1;
      if (question.correctAnswer !== null && response === question.correctAnswer) correctCount += 1;
    }
  }

  return {
    formatId,
    expectedCount,
    timeExpired: body.timeExpired,
    correctCount,
    answeredCount,
    percentage: Math.round((correctCount / expectedCount) * 100),
  };
}