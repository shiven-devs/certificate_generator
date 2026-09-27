import { connectDb } from "@/lib/db/connect";
import { requireUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/http/origin";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { disconnectNotion } from "@/services/notes.service";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await connectDb();
    await disconnectNotion(user.id);
    return jsonSuccess({ connected: false });
  } catch (error) {
    return toErrorResponse(error);
  }
}
