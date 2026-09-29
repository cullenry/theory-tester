import { questions, type Question } from "@/lib/questions";
import { taxonomyCategories } from "@/lib/question-taxonomy";
import type { QuestionAttempt } from "@/lib/progress";

export const COURSE_LESSON_SIZE = 8;

export type CourseLesson = {
  index: number;
  questionIds: number[];
};

export type CourseChapter = {
  index: number;
  id: string;
  name: string;
  count: number;
  questions: Question[];
  lessons: CourseLesson[];
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function chunkQuestions(items: Question[]) {
  const lessons: CourseLesson[] = [];

  for (let start = 0, index = 0; start < items.length; start += COURSE_LESSON_SIZE, index += 1) {
    lessons.push({
      index,
      questionIds: items.slice(start, start + COURSE_LESSON_SIZE).map((question) => question.id),
    });
  }

  return lessons;
}

export function getCourseChapters(): CourseChapter[] {
  const chapters = taxonomyCategories.map((category, index) => {
    const chapterQuestions = questions.filter((question) => question.taxonomy.category === category.name);

    return {
      index,
      id: slugify(category.name) || `chapter-${index + 1}`,
      name: category.name,
      count: chapterQuestions.length,
      questions: chapterQuestions,
      lessons: chunkQuestions(chapterQuestions),
    };
  });

  const uncategorized = questions.filter((question) => !question.taxonomy.category);

  if (uncategorized.length) {
    const index = chapters.length;
    chapters.push({
      index,
      id: "uncategorized",
      name: "Extra road knowledge",
      count: uncategorized.length,
      questions: uncategorized,
      lessons: chunkQuestions(uncategorized),
    });
  }

  return chapters;
}

export function getCourseProgress(attempts: QuestionAttempt[]) {
  const seen = new Set<number>();

  for (const attempt of attempts) {
    if (attempt.selected_answer !== null) seen.add(attempt.question_id);
  }

  const seenCount = questions.reduce((count, question) => count + (seen.has(question.id) ? 1 : 0), 0);

  return {
    seen,
    seenCount,
    total: questions.length,
    percent: questions.length ? Math.round((seenCount / questions.length) * 100) : 0,
  };
}

export function getChapterProgress(chapter: CourseChapter, seen: Set<number>) {
  const seenCount = chapter.questions.filter((question) => seen.has(question.id)).length;
  return {
    seenCount,
    total: chapter.count,
    percent: chapter.count ? Math.round((seenCount / chapter.count) * 100) : 0,
  };
}

export function getLessonProgress(lesson: CourseLesson, seen: Set<number>) {
  const seenCount = lesson.questionIds.filter((id) => seen.has(id)).length;

  return {
    seenCount,
    total: lesson.questionIds.length,
    complete: lesson.questionIds.length > 0 && seenCount === lesson.questionIds.length,
  };
}

export function getNextCourseLesson(attempts: QuestionAttempt[]) {
  const chapters = getCourseChapters();
  const { seen } = getCourseProgress(attempts);

  for (const chapter of chapters) {
    for (const lesson of chapter.lessons) {
      const progress = getLessonProgress(lesson, seen);
      if (!progress.complete) {
        return {
          chapter,
          lesson,
          chapterIndex: chapter.index,
          lessonIndex: lesson.index,
        };
      }
    }
  }

  const lastChapter = chapters[chapters.length - 1];
  const lastLesson = lastChapter?.lessons[lastChapter.lessons.length - 1];

  return lastChapter && lastLesson
    ? {
        chapter: lastChapter,
        lesson: lastLesson,
        chapterIndex: lastChapter.index,
        lessonIndex: lastLesson.index,
      }
    : null;
}

export function getCourseLessonQuestions(
  chapterIndex: number,
  lessonIndex: number,
  attempts: QuestionAttempt[],
): Question[] {
  const chapters = getCourseChapters();
  const chapter = chapters[chapterIndex];
  const lesson = chapter?.lessons[lessonIndex];

  if (!lesson) return [];

  const lastAttemptByQuestion = new Map<number, QuestionAttempt>();

  for (const attempt of [...attempts].reverse()) {
    if (attempt.selected_answer === null) continue;
    lastAttemptByQuestion.set(attempt.question_id, attempt);
  }

  const lessonQuestions = lesson.questionIds
    .map((id) => chapter.questions.find((question) => question.id === id))
    .filter((question): question is Question => Boolean(question));

  return [...lessonQuestions].sort((a, b) => {
    const aAttempt = lastAttemptByQuestion.get(a.id);
    const bAttempt = lastAttemptByQuestion.get(b.id);

    if (!aAttempt && bAttempt) return -1;
    if (aAttempt && !bAttempt) return 1;

    if (aAttempt && bAttempt && aAttempt.is_correct !== bAttempt.is_correct) {
      return aAttempt.is_correct ? 1 : -1;
    }

    return lesson.questionIds.indexOf(a.id) - lesson.questionIds.indexOf(b.id);
  });
}
