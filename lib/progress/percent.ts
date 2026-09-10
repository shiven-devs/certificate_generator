export function creditedPercent(
  watchedSeconds: number,
  durationSeconds: number,
): number {
  return Math.min(
    100,
    Math.round(
      (Math.max(0, watchedSeconds) / Math.max(1, durationSeconds)) * 100,
    ),
  );
}

export function courseCreditedPercent(
  items: { youtubeVideoId: string; durationSeconds: number }[],
  itemProgress: { youtubeVideoId: string; watchedSeconds: number }[],
): number {
  const totalDuration = items.reduce(
    (sum, item) => sum + Math.max(0, item.durationSeconds),
    0,
  );
  const watched = items.reduce((sum, item) => {
    const progress = itemProgress.find(
      (row) => row.youtubeVideoId === item.youtubeVideoId,
    );
    const duration = Math.max(0, item.durationSeconds);
    return sum + Math.min(duration, Math.max(0, progress?.watchedSeconds ?? 0));
  }, 0);

  return creditedPercent(watched, totalDuration);
}
