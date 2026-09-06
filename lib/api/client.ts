import { ErrorCodes } from "@/lib/errors/app-error";

export type ClientApiError = {
  code: string;
  message: string;
};

export function isSessionInvalidated(error: ClientApiError): boolean {
  return error.code === ErrorCodes.SESSION_INVALIDATED;
}

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: ClientApiError }> {
  const response = await fetch(input, init);
  const payload = (await response.json()) as {
    success: boolean;
    data?: T;
    error?: ClientApiError;
  };

  if (!response.ok || !payload.success || payload.data === undefined) {
    return {
      ok: false,
      error: payload.error ?? {
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Something went wrong. Please try again.",
      },
    };
  }

  return { ok: true, data: payload.data };
}
