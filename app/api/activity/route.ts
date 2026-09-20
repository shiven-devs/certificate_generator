import { connectDb } from "@/lib/db/connect";
import { requireUser } from "@/lib/auth/session";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { getActivityOverview } from "@/services/activity.service";

export async function GET() {
  try {
    const user = await requireUser();
    await connectDb();
    const activity = await getActivityOverview(user.id);
    return jsonSuccess({ activity });
  } catch (error) {
    return toErrorResponse(error);
  }
}
