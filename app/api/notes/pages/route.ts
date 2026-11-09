import { connectDb } from "@/lib/db/connect";
import { requireUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/http/origin";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  createMemoryRateLimiter,
  userRateLimitKey,
} from "@/lib/rate-limit/memory";
import { parseSearchParams } from "@/lib/validation/parse";
import { deleteNotePageSchema } from "@/schemas/notes.schema";
import { deleteLessonNotePage } from "@/services/notes.service";

const limiter = createMemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
});

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const limit = limiter.consume(userRateLimitKey(user.id, "note-page-delete"));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many note page changes. Please wait a moment.",
        429,
      );
    }

    const query = parseSearchParams(request.url, deleteNotePageSchema);
    await connectDb();
    const note = await deleteLessonNotePage(user.id, query);
    return jsonSuccess({ note });
  } catch (error) {
    return toErrorResponse(error);
  }
}
