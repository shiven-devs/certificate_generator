import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db/connect";
import { resolveSession } from "@/lib/auth/session";
import { getCourseForUser } from "@/services/course.service";
import { AppError } from "@/lib/errors/app-error";
import { CoursePlayer } from "@/components/player/course-player";

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ notion?: string | string[] }>;
}) {
  const session = await resolveSession();
  if (session.status !== "authenticated") {
    return null;
  }

  const { courseId } = await params;
  const query = await searchParams;
  const notionReturn = typeof query.notion === "string" ? query.notion : null;
  await connectDb();

  let data: Awaited<ReturnType<typeof getCourseForUser>>;
  try {
    data = await getCourseForUser(session.user.id, courseId);
  } catch (error) {
    if (error instanceof AppError && (error.status === 404 || error.status === 403)) {
      notFound();
    }
    throw error;
  }

  const { course, enrollment } = data;

  return (
    <>
      <Link href="/dashboard" className="text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-400">
        Back to my courses
      </Link>
      <div className="mt-4">
        <CoursePlayer
          course={course}
          enrollment={enrollment}
          notionReturn={notionReturn}
        />
      </div>
    </>
  );
}
