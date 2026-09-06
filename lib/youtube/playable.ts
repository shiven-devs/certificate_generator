import type { CoursePreview, CoursePreviewItem } from "@/lib/youtube/types";

export function playablePreviewItems(
  items: CoursePreviewItem[],
): CoursePreviewItem[] {
  return items
    .filter((item) => item.playable && item.durationSeconds > 0)
    .map((item, order) => ({ ...item, order }));
}

export function isPreviewEnrollable(items: CoursePreviewItem[]): boolean {
  return playablePreviewItems(items).length > 0;
}

export function skippedPreviewItems(preview: CoursePreview): CoursePreviewItem[] {
  return preview.items.filter((item) => !item.playable);
}
