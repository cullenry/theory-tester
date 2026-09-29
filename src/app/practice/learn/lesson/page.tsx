import { CourseLesson } from "@/components/course-lesson";

export const metadata = {
  title: "Learn lesson",
};

type LessonPageProps = {
  searchParams: Promise<{ chapter?: string | string[]; lesson?: string | string[] }>;
};

export default async function LessonPage({ searchParams }: LessonPageProps) {
  const params = await searchParams;
  const chapter = Array.isArray(params.chapter) ? params.chapter[0] : params.chapter;
  const lesson = Array.isArray(params.lesson) ? params.lesson[0] : params.lesson;

  return <CourseLesson chapterIndex={Number(chapter)} lessonIndex={Number(lesson)} />;
}
