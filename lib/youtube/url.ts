import { AppError, ErrorCodes } from "@/lib/errors/app-error";

export const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
export const YOUTUBE_PLAYLIST_ID_PATTERN = /^[A-Za-z0-9_-]{10,128}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export type ParsedYoutubeRef = {
  sourceType: "video" | "playlist";
  youtubeId: string;
};

export function isYoutubeMusicUrl(input: string): boolean {
  const url = parseUrl(input);
  return url?.hostname.toLowerCase() === "music.youtube.com";
}

export function parseYoutubeUrl(input: string): ParsedYoutubeRef {
  const trimmed = input.trim();
  if (!trimmed) {
    throw invalidUrl();
  }

  const url = parseUrl(trimmed);
  if (!url) {
    throw invalidUrl();
  }

  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) {
    throw invalidUrl();
  }

  const listId = url.searchParams.get("list");
  if (listId) {
    if (!YOUTUBE_PLAYLIST_ID_PATTERN.test(listId)) {
      throw invalidUrl();
    }
    return { sourceType: "playlist", youtubeId: listId };
  }

  const videoId = extractVideoId(host, url);
  if (!videoId) {
    throw invalidUrl();
  }

  return { sourceType: "video", youtubeId: videoId };
}

function parseUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

function extractVideoId(host: string, url: URL): string | null {
  const queryId = url.searchParams.get("v");
  if (queryId && YOUTUBE_VIDEO_ID_PATTERN.test(queryId)) {
    return queryId;
  }

  const segments = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = segments[0];
    return id && YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : null;
  }

  const nested = segments[0];
  if (nested === "shorts" || nested === "embed" || nested === "live") {
    const id = segments[1];
    return id && YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : null;
  }

  return null;
}

function invalidUrl(): AppError {
  return new AppError(
    ErrorCodes.INVALID_YOUTUBE_URL,
    "Paste a YouTube video or playlist URL.",
    400,
  );
}
