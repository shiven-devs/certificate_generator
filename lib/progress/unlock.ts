export function isVideoUnlocked(
  courseItems: { youtubeVideoId: string }[],
  itemProgress: { youtubeVideoId: string; completed: boolean }[],
  youtubeVideoId: string,
): boolean {
  const index = courseItems.findIndex(
    (item) => item.youtubeVideoId === youtubeVideoId,
  );
  if (index <= 0) {
    return index === 0;
  }

  const previousId = courseItems[index - 1]?.youtubeVideoId;
  if (!previousId) {
    return false;
  }

  return itemProgress.some(
    (item) => item.youtubeVideoId === previousId && item.completed,
  );
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
