import { AppError, ErrorCodes } from "@/lib/errors/app-error";

const NOTION_API = "https://api.notion.com/v1";
export const NOTION_VERSION = "2026-03-11";

type NotionErrorBody = {
  code?: unknown;
  message?: unknown;
};

export async function notionApiRequest<T>(input: {
  accessToken: string;
  path: string;
  method: "GET" | "POST" | "PATCH";
  body?: unknown;
}): Promise<{ ok: true; data: T } | { ok: false; status: number; code: string }> {
  const response = await fetch(`${NOTION_API}${input.path}`, {
    method: input.method,
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
  });

  if (!response.ok) {
    let code = "unknown";
    try {
      const failure = (await response.json()) as NotionErrorBody;
      if (typeof failure.code === "string") {
        code = failure.code;
      }
    } catch {
      // Ignore unreadable error bodies; map from HTTP status instead.
    }
    return { ok: false, status: response.status, code };
  }

  const data = (await response.json()) as T;
  return { ok: true, data };
}

export function notionFailureToAppError(status: number, code: string): AppError {
  if (status === 401 || code === "unauthorized") {
    return new AppError(
      ErrorCodes.NOTION_NOT_CONNECTED,
      "Reconnect Notion to keep syncing your notes.",
      401,
    );
  }
  if (status === 403 || code === "restricted_resource") {
    return new AppError(
      ErrorCodes.NOTION_SYNC_FAILED,
      "Notion did not allow this page to be created or updated. Reconnect and allow access to your workspace.",
      403,
    );
  }
  if (status === 429 || code === "rate_limited") {
    return new AppError(
      ErrorCodes.RATE_LIMITED,
      "Notion is temporarily limiting syncs. Please try again in a moment.",
      429,
    );
  }
  return new AppError(
    ErrorCodes.NOTION_SYNC_FAILED,
    "Could not sync this note to Notion. Please try again.",
    502,
  );
}
