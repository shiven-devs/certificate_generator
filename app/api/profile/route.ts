import { connectDb } from "@/lib/db/connect";
import { requireUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/http/origin";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/validation/parse";
import { profileSettingsSchema } from "@/schemas/profile.schema";
import { getMyProfile, updateMyProfileSettings } from "@/services/profile.service";

export async function GET() {
  try {
    const user = await requireUser();
    await connectDb();
    return jsonSuccess(await getMyProfile(user.id));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = await parseJsonBody(request, profileSettingsSchema);
    await connectDb();
    return jsonSuccess(await updateMyProfileSettings(user.id, input));
  } catch (error) {
    return toErrorResponse(error);
  }
}
