import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { courseIdParamSchema } from "@/schemas/course.schema";
import { toPublicCourse, type PublicCourse } from "@/repositories/course.repository";
import {
  findEnrollment,
  listEnrollmentsForUser,
  toPublicEnrollment,
  type PublicEnrollment,
} from "@/repositories/enrollment.repository";

export type EnrollmentListItem = {
  enrollment: PublicEnrollment;
  course: PublicCourse;
};

export async function listMyEnrollments(
  userId: string,
): Promise<EnrollmentListItem[]> {
  const rows = await listEnrollmentsForUser(userId);
  return rows.flatMap((row) => {
    if (!row.course) {
      return [];
    }
    return [
      {
        enrollment: toPublicEnrollment(row, row.course._id.toString()),
        course: toPublicCourse(row.course),
      },
    ];
  });
}

export async function getMyEnrollment(userId: string, courseId: string) {
  const parsed = courseIdParamSchema.safeParse({ courseId });
  if (!parsed.success) {
    throw new AppError(ErrorCodes.NOT_FOUND, "You are not enrolled in this course.", 404);
  }

  const enrollment = await findEnrollment(userId, parsed.data.courseId);
  if (!enrollment) {
    throw new AppError(
      ErrorCodes.NOT_FOUND,
      "You are not enrolled in this course.",
      404,
    );
  }
  return toPublicEnrollment(enrollment);
}
