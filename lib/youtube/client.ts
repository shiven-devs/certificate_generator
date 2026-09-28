import { z } from "zod";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { getEnv } from "@/lib/config/env";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

const thumbnailSchema = z
  .object({
    url: z.string().optional(),
  })
  .optional();

const thumbnailsSchema = z
  .object({
    high: thumbnailSchema,
    medium: thumbnailSchema,
    default: thumbnailSchema,
    standard: thumbnailSchema,
    maxres: thumbnailSchema,
  })
  .optional();

const videoListSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        snippet: z
          .object({
            title: z.string().optional(),
            description: z.string().optional(),
            categoryId: z.string().optional(),
            tags: z.array(z.string()).optional(),
            liveBroadcastContent: z.string().optional(),
            thumbnails: thumbnailsSchema,
          })
          .optional(),
        contentDetails: z
          .object({
            duration: z.string().optional(),
          })
          .optional(),
        status: z
          .object({
            embeddable: z.boolean().optional(),
            privacyStatus: z.string().optional(),
            uploadStatus: z.string().optional(),
          })
          .optional(),
      }),
    )
    .default([]),
});

const playlistListSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        snippet: z
          .object({
            title: z.string().optional(),
            thumbnails: thumbnailsSchema,
          })
          .optional(),
      }),
    )
    .default([]),
});

const playlistItemsSchema = z.object({
  nextPageToken: z.string().nullish(),
  items: z
    .array(
      z.object({
        snippet: z
          .object({
            title: z.string().optional(),
            position: z.number().optional(),
            resourceId: z
              .object({
                kind: z.string().optional(),
                videoId: z.string().optional(),
              })
              .optional(),
          })
          .optional(),
        contentDetails: z
          .object({
            videoId: z.string().optional(),
          })
          .optional(),
        status: z
          .object({
            privacyStatus: z.string().optional(),
          })
          .optional(),
      }),
    )
    .default([]),
});

export type YoutubeVideoResource = z.infer<typeof videoListSchema>["items"][number];
export type YoutubePlaylistResource = z.infer<typeof playlistListSchema>["items"][number];
export type YoutubePlaylistItem = z.infer<typeof playlistItemsSchema>["items"][number];

function apiKey(): string {
  const key = getEnv().YOUTUBE_API_KEY;
  if (!key) {
    throw new AppError(
      ErrorCodes.YOUTUBE_NOT_CONFIGURED,
      "YouTube is not configured yet. Add YOUTUBE_API_KEY on the server.",
      503,
    );
  }
  return key;
}

export async function youtubeGet(
  path: "videos" | "playlistItems" | "playlists",
  params: Record<string, string>,
): Promise<unknown> {
  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("key", apiKey());

  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    throw new AppError(
      ErrorCodes.YOUTUBE_UNAVAILABLE,
      "Could not reach YouTube. Please try again.",
      503,
    );
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw mapYoutubeHttpError(response.status, body);
  }

  return body;
}

export function parseVideoList(body: unknown) {
  return videoListSchema.parse(body);
}

export function parsePlaylistList(body: unknown) {
  return playlistListSchema.parse(body);
}

export function parsePlaylistItems(body: unknown) {
  return playlistItemsSchema.parse(body);
}

export function pickThumbnailUrl(
  thumbnails: z.infer<typeof thumbnailsSchema>,
): string {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    ""
  );
}

function mapYoutubeHttpError(status: number, body: unknown): AppError {
  const reason = extractReason(body);

  if (status === 403 && (reason === "quotaExceeded" || reason === "dailyLimitExceeded")) {
    return new AppError(
      ErrorCodes.YOUTUBE_QUOTA_EXCEEDED,
      "YouTube’s request limit for today has been reached. Try again later.",
      503,
    );
  }

  if (status === 404 || reason === "playlistNotFound" || reason === "videoNotFound") {
    return new AppError(
      ErrorCodes.VIDEO_NOT_FOUND,
      "That YouTube content could not be found.",
      404,
    );
  }

  return new AppError(
    ErrorCodes.YOUTUBE_UNAVAILABLE,
    "YouTube could not return this course right now. Please try again.",
    503,
  );
}

function extractReason(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || !("error" in body)) {
    return undefined;
  }
  const error = (body as { error?: { errors?: { reason?: string }[] } }).error;
  return error?.errors?.[0]?.reason;
}
