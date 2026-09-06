import { ZodError } from "zod";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export function jsonSuccess<T>(data: T, init?: ResponseInit): Response {
  const body: ApiSuccess<T> = { success: true, data };
  return Response.json(body, init);
}

export function jsonError(
  code: string,
  message: string,
  status: number,
): Response {
  const body: ApiErrorBody = {
    success: false,
    error: { code, message },
  };
  return Response.json(body, { status });
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return jsonError(error.code, error.message, error.status);
  }

  if (error instanceof ZodError) {
    const first = error.issues[0];
    const message = first?.message ?? "Invalid request.";
    return jsonError(ErrorCodes.VALIDATION_ERROR, message, 400);
  }

  console.error("Unhandled API error");
  return jsonError(
    ErrorCodes.INTERNAL_ERROR,
    "Something went wrong. Please try again.",
    500,
  );
}
