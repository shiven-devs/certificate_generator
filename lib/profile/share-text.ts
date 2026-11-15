export type ShareStats = {
  name: string;
  completedLessonCount: number;
  completedCourseCount: number;
  longestStreak: number;
};

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** Meta and share-card description for a public profile. */
export function profileShareDescription(stats: ShareStats): string {
  const streak =
    stats.longestStreak > 0 ? `, with a ${stats.longestStreak}-day best streak` : "";

  return `${stats.name} has completed ${plural(
    stats.completedCourseCount,
    "course",
  )} and ${plural(
    stats.completedLessonCount,
    "lecture",
  )} on CertiTube${streak}. See their learning journey.`;
}
