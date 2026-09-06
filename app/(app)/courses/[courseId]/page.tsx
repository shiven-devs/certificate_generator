import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db/connect";
import { resolveSession } from "@/lib/auth/session";
import { getCourseForUser } from "@/services/course.service";
import { AppError } from "@/lib/errors/app-error";
import { CoursePlayer } from "@/components/player/course-player";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await resolveSession();
  if (session.status !== "authenticated") {
    return null;
  }

  const { courseId } = await params;
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
      <Link href="/dashboard" className="text-sm font-medium text-indigo-700 hover:underline">
        Back to my courses
      </Link>
      <div className="mt-4">
        <CoursePlayer course={course} enrollment={enrollment} />
      </div>
    </>
  );
}
