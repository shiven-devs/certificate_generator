import { AppError, ErrorCodes } from "@/lib/errors/app-error";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }

  const expected = new URL(request.url).origin;
  if (origin !== expected) {
    throw new AppError(
      ErrorCodes.CSRF_REJECTED,
      "This request could not be verified.",
      403,
    );
  }
}
