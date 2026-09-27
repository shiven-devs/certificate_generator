import { connectDb } from "@/lib/db/connect";
import { requireUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/http/origin";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  createMemoryRateLimiter,
  userRateLimitKey,
} from "@/lib/rate-limit/memory";
import { parseJsonBody } from "@/lib/validation/parse";
import { syncLessonNoteSchema } from "@/schemas/notes.schema";
import { syncLessonNoteToNotion } from "@/services/notes.service";

const limiter = createMemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 12,
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const limit = limiter.consume(userRateLimitKey(user.id, "notes-sync"));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many Notion syncs. Please wait a moment.",
        429,
      );
    }

    const body = await parseJsonBody(request, syncLessonNoteSchema);
    await connectDb();
    const note = await syncLessonNoteToNotion(user.id, body);
    return jsonSuccess({ note });
  } catch (error) {
    return toErrorResponse(error);
  }
}
