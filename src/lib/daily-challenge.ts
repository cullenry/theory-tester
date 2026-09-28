import { questions, type Question } from "@/lib/questions";

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle(items: Question[], seed: number) {
  const result = [...items];
  let state = seed || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = Math.floor((state / 4294967296) * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function getDailyChallengeQuestions(date = new Date()): Question[] {
  const dayKey = date.toISOString().slice(0, 10);
  return seededShuffle(questions, hashSeed("theorytester-daily-" + dayKey)).slice(0, 10);
}

export function getDailyChallengeDate() {
  return new Date().toISOString().slice(0, 10);
}
