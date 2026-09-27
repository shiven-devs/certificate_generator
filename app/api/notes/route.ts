import { connectDb } from "@/lib/db/connect";
import { requireUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/http/origin";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import {
  createMemoryRateLimiter,
  userRateLimitKey,
} from "@/lib/rate-limit/memory";
import { parseJsonBody, parseSearchParams } from "@/lib/validation/parse";
import {
  lessonNoteQuerySchema,
  saveLessonNoteSchema,
} from "@/schemas/notes.schema";
import { getLessonNote, saveLessonNote } from "@/services/notes.service";

const getLimiter = createMemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 90,
});

const saveLimiter = createMemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const limit = getLimiter.consume(userRateLimitKey(user.id, "notes-read"));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many note requests. Please wait a moment.",
        429,
      );
    }

    const query = parseSearchParams(request.url, lessonNoteQuerySchema);
    await connectDb();
    const note = await getLessonNote(user.id, query.courseId, query.youtubeVideoId);
    return jsonSuccess({ note });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const limit = saveLimiter.consume(userRateLimitKey(user.id, "notes-save"));
    if (!limit.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMITED,
        "Too many note saves. Please wait a moment.",
        429,
      );
    }

    const body = await parseJsonBody(request, saveLessonNoteSchema);
    await connectDb();
    const note = await saveLessonNote(user.id, body);
    return jsonSuccess({ note });
  } catch (error) {
    return toErrorResponse(error);
  }
}
