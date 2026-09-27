import { z } from "zod";
import { YOUTUBE_VIDEO_ID_PATTERN } from "@/lib/youtube/url";

export const heartbeatSchema = z.object({
  youtubeVideoId: z.string().regex(YOUTUBE_VIDEO_ID_PATTERN, "Invalid video."),
  currentTime: z.number().finite().min(0),
  playbackRate: z.number().finite().min(0.25).max(4),
  timeZone: z.string().trim().min(1).max(80).optional(),
});

export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
