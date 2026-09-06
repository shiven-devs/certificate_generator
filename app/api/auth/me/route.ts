import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await requireUser();
    return jsonSuccess({ user });
  } catch (error) {
    return toErrorResponse(error);
  }
}
