export type ItemIssueReason =
  | "not_embeddable"
  | "unavailable"
  | "live"
  | "no_duration"
  | "not_learning";

export type CoursePreviewItem = {
  youtubeVideoId: string;
  title: string;
  description: string;
  durationSeconds: number;
  order: number;
  playable: boolean;
  issue: ItemIssueReason | null;
};

export type CoursePreview = {
  youtubeId: string;
  sourceType: "video" | "playlist";
  title: string;
  thumbnailUrl: string;
  items: CoursePreviewItem[];
  totalDurationSeconds: number;
  enrollable: boolean;
  learningEligible: boolean;
};
