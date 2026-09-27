import { connectDb } from "@/lib/db/connect";
import { requireUser } from "@/lib/auth/session";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { getNotionStatus } from "@/services/notes.service";

export async function GET() {
  try {
    const user = await requireUser();
    await connectDb();
    const status = await getNotionStatus(user.id);
    return jsonSuccess(status);
  } catch (error) {
    return toErrorResponse(error);
  }
}
