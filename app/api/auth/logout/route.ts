import { clearAuthCookie, readAuthCookie } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { connectDb } from "@/lib/db/connect";
import { assertSameOrigin } from "@/lib/http/origin";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { logoutCurrentSession } from "@/services/auth.service";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const token = await readAuthCookie();
    const payload = token ? await verifyAccessToken(token) : null;

    if (payload) {
      await connectDb();
      await logoutCurrentSession(payload.userId, payload.sessionId);
    }

    await clearAuthCookie();
    return jsonSuccess({ loggedOut: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
