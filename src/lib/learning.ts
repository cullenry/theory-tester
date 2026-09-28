import type { Question } from "@/lib/questions";
import type { QuestionAttempt } from "@/lib/progress";

export type LearningKind = "focus" | "reinforce" | "new";

export type LearningItem = {
  question: Question;
  kind: LearningKind;
  priority: number;
};

type LearningStats = {
  attempts: number;
  correct: number;
  incorrect: number;
  lastAttemptAt: string | null;
  lastCorrectAt: string | null;
  lastIncorrectAt: string | null;
  consecutiveCorrect: number;
};

const SPACING_DAYS = [1, 2, 4, 7, 14, 30];

function buildStats(attempts: QuestionAttempt[]) {
  const stats = new Map<number, LearningStats>();

  for (const attempt of [...attempts].reverse()) {
    const current = stats.get(attempt.question_id) ?? {
      attempts: 0,
      correct: 0,
      incorrect: 0,
      lastAttemptAt: null,
      lastCorrectAt: null,
      lastIncorrectAt: null,
      consecutiveCorrect: 0,
    };

    if (attempt.selected_answer === null) continue;

    current.attempts += 1;
    if (attempt.is_correct) {
      current.correct += 1;
      current.consecutiveCorrect += 1;
      current.lastCorrectAt = attempt.created_at;
    } else {
      current.incorrect += 1;
      current.consecutiveCorrect = 0;
      current.lastIncorrectAt = attempt.created_at;
    }

    current.lastAttemptAt = attempt.created_at;
    stats.set(attempt.question_id, current);
  }

  return stats;
}

function hoursSince(value: string | null, now: number) {
  if (!value) return Infinity;
  return Math.max(0, (now - new Date(value).getTime()) / 3_600_000);
}

function priorityFor(question: Question, stats: LearningStats | undefined, now: number) {
  if (!stats) return 45;

  const accuracy = stats.correct / Math.max(1, stats.attempts);
  const struggleScore = (1 - accuracy) * 62;
  const incorrectDepth = Math.min(16, stats.incorrect * 4);
  const lastWrongHours = hoursSince(stats.lastIncorrectAt, now);
  const recentWrongBonus = lastWrongHours < 72 ? Math.max(0, 18 - lastWrongHours / 4) : 0;

  const intervalDays = SPACING_DAYS[Math.min(stats.consecutiveCorrect, SPACING_DAYS.length - 1)];
  const hoursDue = intervalDays * 24;
  const elapsedSinceLast = hoursSince(stats.lastAttemptAt, now);
  const spacingDue = stats.lastAttemptAt ? Math.min(1.3, elapsedSinceLast / hoursDue) * 24 : 24;

  const lessRecentPenalty = accuracy >= 0.9 && lastWrongHours > 168 ? -8 : 0;

  return Math.max(1, struggleScore + incorrectDepth + recentWrongBonus + spacingDue + lessRecentPenalty);
}

function weightedPick(
  pool: LearningItem[],
  used: Set<number>,
  previousCategory: string | null,
): LearningItem | null {
  const available = pool.filter((item) => !used.has(item.question.id));
  if (!available.length) return null;

  const categoryDiverse = previousCategory
    ? available.filter((item) => item.question.taxonomy.category !== previousCategory)
    : available;
  const candidates = (categoryDiverse.length ? categoryDiverse : available)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8);

  const weights = candidates.map((item) => Math.max(0.35, item.priority / 25));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = Math.random() * total;

  for (let index = 0; index < candidates.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return candidates[index];
  }

  return candidates[candidates.length - 1];
}

export function buildLearningPlan(
  questions: Question[],
  attempts: QuestionAttempt[],
  count = 20,
): LearningItem[] {
  const stats = buildStats(attempts);
  const now = Date.now();

  const focus: LearningItem[] = [];
  const reinforce: LearningItem[] = [];
  const fresh: LearningItem[] = [];

  for (const question of questions) {
    const questionStats = stats.get(question.id);
    const priority = priorityFor(question, questionStats, now);

    if (!questionStats) {
      fresh.push({ question, kind: "new", priority });
      continue;
    }

    const accuracy = questionStats.correct / Math.max(1, questionStats.attempts);
    const recentlyWrong = hoursSince(questionStats.lastIncorrectAt, now) < 168;

    if (questionStats.incorrect > 0 && (accuracy < 0.85 || recentlyWrong)) {
      focus.push({ question, kind: "focus", priority: priority + 20 });
    } else {
      reinforce.push({
        question,
        kind: "reinforce",
        priority: priority + (hoursSince(questionStats.lastCorrectAt, now) > 24 ? 12 : 0),
      });
    }
  }

  const used = new Set<number>();
  const plan: LearningItem[] = [];
  const targetFocus = Math.min(Math.round(count * 0.55), focus.length);
  const targetReinforce = Math.min(Math.round(count * 0.2), reinforce.length);
  const targetNew = Math.min(Math.max(0, count - targetFocus - targetReinforce), fresh.length);

  let previousCategory: string | null = null;

  const pools: LearningItem[][] = [focus, fresh, focus, reinforce, fresh];

  const targetCounts = {
    focus: targetFocus,
    reinforce: targetReinforce,
    new: targetNew,
  };

  function take(kind: LearningKind) {
    const pool = kind === "focus" ? focus : kind === "reinforce" ? reinforce : fresh;
    const next = weightedPick(pool, used, previousCategory);
    if (!next) return false;
    used.add(next.question.id);
    plan.push(next);
    previousCategory = next.question.taxonomy.category;
    return true;
  }

  while (plan.length < count && (
    targetCounts.focus > 0 || targetCounts.reinforce > 0 || targetCounts.new > 0
  )) {
    const before = plan.length;

    for (const kind of ["focus", "new", "focus", "reinforce", "new"] as LearningKind[]) {
      if (plan.length >= count) break;
      if (targetCounts[kind] > 0 && take(kind)) {
        targetCounts[kind] -= 1;
      }
    }

    if (plan.length === before) break;
  }

  for (const pool of pools) {
    while (plan.length < count) {
      const next = weightedPick(pool, used, previousCategory);
      if (!next) break;
      used.add(next.question.id);
      plan.push(next);
      previousCategory = next.question.taxonomy.category;
    }
  }

  if (plan.length < count) {
    const remaining = [...questions]
      .filter((question) => !used.has(question.id))
      .sort(() => Math.random() - 0.5);

    for (const question of remaining) {
      if (plan.length >= count) break;
      plan.push({ question, kind: "new", priority: 1 });
      used.add(question.id);
    }
  }

  return plan.slice(0, Math.min(count, questions.length));
}

export function getLearningSummary(attempts: QuestionAttempt[]) {
  const stats = buildStats(attempts);
  let struggled = 0;
  let mastered = 0;

  for (const entry of stats.values()) {
    const accuracy = entry.correct / Math.max(1, entry.attempts);
    if (entry.incorrect > 0 && accuracy < 0.85) struggled += 1;
    if (entry.attempts >= 2 && accuracy >= 0.9) mastered += 1;
  }

  return { struggled, mastered, seen: stats.size };
}
