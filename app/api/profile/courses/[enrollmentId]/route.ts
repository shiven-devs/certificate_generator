import { connectDb } from "@/lib/db/connect";
import { requireUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/http/origin";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/validation/parse";
import { profileCourseVisibilitySchema } from "@/schemas/profile.schema";
import { setMyProfileCourseVisibility } from "@/services/profile.service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ enrollmentId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { enrollmentId } = await context.params;
    const input = await parseJsonBody(request, profileCourseVisibilitySchema);
    await connectDb();
    return jsonSuccess(
      await setMyProfileCourseVisibility(user.id, enrollmentId, input),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
