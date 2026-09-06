import { connectDb } from "@/lib/db/connect";
import { requireUser } from "@/lib/auth/session";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { courseIdParamSchema } from "@/schemas/course.schema";
import { getCourseForUser } from "@/services/course.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const user = await requireUser();
    const { courseId } = courseIdParamSchema.parse(await context.params);
    await connectDb();
    const result = await getCourseForUser(user.id, courseId);
    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
