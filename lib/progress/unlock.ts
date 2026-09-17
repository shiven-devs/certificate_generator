export function isVideoUnlocked(
  courseItems: { youtubeVideoId: string }[],
  _itemProgress: { youtubeVideoId: string; completed: boolean }[],
  youtubeVideoId: string,
): boolean {
  return courseItems.some((item) => item.youtubeVideoId === youtubeVideoId);
}

export function firstPlayableVideoId(
  courseItems: { youtubeVideoId: string }[],
  itemProgress: { youtubeVideoId: string; completed: boolean }[],
): string {
  const next = courseItems.find((item) => {
    const progress = itemProgress.find(
      (row) => row.youtubeVideoId === item.youtubeVideoId,
    );
    return (
      isVideoUnlocked(courseItems, itemProgress, item.youtubeVideoId) &&
      !progress?.completed
    );
  });

  return next?.youtubeVideoId ?? courseItems[0]?.youtubeVideoId ?? "";
}
