import { connectDb } from "@/lib/db/connect";
import { requireUser } from "@/lib/auth/session";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { courseIdParamSchema } from "@/schemas/course.schema";
import { getMyEnrollment } from "@/services/enrollment.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const user = await requireUser();
    const { courseId } = courseIdParamSchema.parse(await context.params);
    await connectDb();
    const enrollment = await getMyEnrollment(user.id, courseId);
    return jsonSuccess({ enrollment });
  } catch (error) {
    return toErrorResponse(error);
  }
}
