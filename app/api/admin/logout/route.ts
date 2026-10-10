import { clearAdminCookie } from "@/lib/auth/admin-session";
import { assertSameOrigin } from "@/lib/http/origin";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await clearAdminCookie();
    return jsonSuccess({ loggedOut: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
