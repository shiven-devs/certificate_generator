import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { parseIso8601Duration } from "@/lib/youtube/duration";
import {
  parsePlaylistItems,
  parsePlaylistList,
  parseVideoList,
  pickThumbnailUrl,
  youtubeGet,
  type YoutubeVideoResource,
} from "@/lib/youtube/client";
import type { ParsedYoutubeRef } from "@/lib/youtube/url";
import type {
  CoursePreview,
  CoursePreviewItem,
  ItemIssueReason,
} from "@/lib/youtube/types";
import { isPreviewEnrollable } from "@/lib/youtube/playable";
import {
  classifyLearningContent,
  withLearningEnrollment,
} from "@/lib/youtube/learning-eligibility";

const VIDEO_BATCH_SIZE = 50;
const PLAYLIST_PAGE_SIZE = 50;
const MAX_PLAYLIST_ITEMS = 200;

export async function resolveYoutubeMetadata(
  ref: ParsedYoutubeRef,
): Promise<CoursePreview> {
  if (ref.sourceType === "video") {
    return resolveVideo(ref.youtubeId);
  }
  return resolvePlaylist(ref.youtubeId);
}

async function resolveVideo(videoId: string): Promise<CoursePreview> {
  const body = await youtubeGet("videos", {
    part: "snippet,contentDetails,status",
    id: videoId,
  });
  const videos = parseVideoList(body).items;
  const video = videos[0];
  if (!video) {
    throw new AppError(
      ErrorCodes.VIDEO_NOT_FOUND,
      "That video could not be found, or it is private.",
      404,
    );
  }

  const item = toPreviewItem(video, 0, video.snippet?.title ?? "Untitled video");
  const thumbnailUrl =
    pickThumbnailUrl(video.snippet?.thumbnails) ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return withLearningEnrollment({
    youtubeId: videoId,
    sourceType: "video",
    title: video.snippet?.title ?? "Untitled video",
    thumbnailUrl,
    items: [item],
    totalDurationSeconds: item.playable ? item.durationSeconds : 0,
    enrollable: item.playable,
    learningEligible: true,
  });
}

async function resolvePlaylist(playlistId: string): Promise<CoursePreview> {
  const playlistBody = await youtubeGet("playlists", {
    part: "snippet",
    id: playlistId,
  });
  const playlist = parsePlaylistList(playlistBody).items[0];
  if (!playlist) {
    throw new AppError(
      ErrorCodes.PLAYLIST_NOT_FOUND,
      "That playlist could not be found, or it is private.",
      404,
    );
  }

  const ordered = await listPlaylistVideoIds(playlistId);
  if (ordered.length === 0) {
    throw new AppError(
      ErrorCodes.PLAYLIST_NOT_FOUND,
      "That playlist has no videos we can use.",
      404,
    );
  }

  const details = await fetchVideosByIds(ordered.map((item) => item.videoId));
  const items: CoursePreviewItem[] = ordered.map((entry, index) => {
    const video = details.get(entry.videoId);
    if (!video) {
      return {
        youtubeVideoId: entry.videoId,
        title: entry.title || "Unavailable video",
        description: "",
        durationSeconds: 0,
        order: index,
        playable: false,
        issue: "unavailable",
      };
    }
    return toPreviewItem(video, index, entry.title);
  });

  const playableItems = items.filter((item) => item.playable);
  const thumbnailUrl =
    pickThumbnailUrl(playlist.snippet?.thumbnails) ||
    (ordered[0]
      ? `https://i.ytimg.com/vi/${ordered[0].videoId}/hqdefault.jpg`
      : "");

  return withLearningEnrollment({
    youtubeId: playlistId,
    sourceType: "playlist",
    title: playlist.snippet?.title ?? "Untitled playlist",
    thumbnailUrl,
    items,
    totalDurationSeconds: playableItems.reduce(
      (sum, item) => sum + item.durationSeconds,
      0,
    ),
    enrollable: isPreviewEnrollable(items),
    learningEligible: true,
  });
}

async function listPlaylistVideoIds(playlistId: string) {
  const collected: { videoId: string; title: string }[] = [];
  let pageToken: string | undefined;

  do {
    const params: Record<string, string> = {
      part: "snippet,contentDetails,status",
      playlistId,
      maxResults: String(PLAYLIST_PAGE_SIZE),
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }

    const parsed = parsePlaylistItems(await youtubeGet("playlistItems", params));

    for (const item of parsed.items) {
      const videoId =
        item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
      if (!videoId) {
        continue;
      }
      collected.push({
        videoId,
        title: item.snippet?.title ?? "Untitled video",
      });
      if (collected.length > MAX_PLAYLIST_ITEMS) {
        throw new AppError(
          ErrorCodes.PLAYLIST_TOO_LARGE,
          `Playlists are limited to ${MAX_PLAYLIST_ITEMS} videos on Certitube.`,
          400,
        );
      }
    }

    pageToken = parsed.nextPageToken ?? undefined;
  } while (pageToken);

  return collected;
}

async function fetchVideosByIds(videoIds: string[]) {
  const unique = [...new Set(videoIds)];
  const byId = new Map<string, YoutubeVideoResource>();

  for (let index = 0; index < unique.length; index += VIDEO_BATCH_SIZE) {
    const batch = unique.slice(index, index + VIDEO_BATCH_SIZE);
    const body = await youtubeGet("videos", {
      part: "snippet,contentDetails,status",
      id: batch.join(","),
    });
    for (const video of parseVideoList(body).items) {
      byId.set(video.id, video);
    }
  }

  return byId;
}

function toPreviewItem(
  video: YoutubeVideoResource,
  order: number,
  fallbackTitle: string,
): CoursePreviewItem {
  const title = video.snippet?.title ?? fallbackTitle;
  const technicalIssue = describeIssue(video);
  const durationSeconds = parseIso8601Duration(
    video.contentDetails?.duration ?? "",
  );
  const issue =
    technicalIssue ??
    (classifyLearningContent({
      title,
      description: video.snippet?.description,
      categoryId: video.snippet?.categoryId,
      tags: video.snippet?.tags,
    })
      ? null
      : "not_learning");

  return {
    youtubeVideoId: video.id,
    title,
    description: sanitizeDescription(video.snippet?.description),
    durationSeconds: durationSeconds ?? 0,
    order,
    playable: issue === null,
    issue,
  };
}

export async function fetchVideoDescriptions(
  videoIds: string[],
): Promise<Map<string, string>> {
  const details = await fetchVideosByIds(videoIds);
  const descriptions = new Map<string, string>();
  for (const [id, video] of details) {
    descriptions.set(id, sanitizeDescription(video.snippet?.description));
  }
  return descriptions;
}

function sanitizeDescription(value: string | undefined): string {
  if (!value) {
    return "";
  }
  return value.replace(/\r\n/g, "\n").trim().slice(0, 8000);
}

function describeIssue(video: YoutubeVideoResource): ItemIssueReason | null {
  if (video.status?.privacyStatus === "private") {
    return "unavailable";
  }
  if (video.status?.uploadStatus && video.status.uploadStatus !== "processed") {
    return "unavailable";
  }
  if (video.status?.embeddable === false) {
    return "not_embeddable";
  }
  const live = video.snippet?.liveBroadcastContent;
  if (live === "live" || live === "upcoming") {
    return "live";
  }
  const durationSeconds = parseIso8601Duration(
    video.contentDetails?.duration ?? "",
  );
  if (durationSeconds === null || durationSeconds < 1) {
    return "no_duration";
  }
  return null;
}
