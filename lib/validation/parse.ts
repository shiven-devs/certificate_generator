import type { ZodType } from "zod";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      "Request body must be valid JSON.",
      400,
    );
  }

  return schema.parse(raw);
}

export function parseSearchParams<T>(url: string, schema: ZodType<T>): T {
  const { searchParams } = new URL(url);
  return schema.parse(Object.fromEntries(searchParams.entries()));
}
