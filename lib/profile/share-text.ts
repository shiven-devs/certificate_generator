export type ShareStats = {
  name: string;
  headline: string | null;
  completedLessonCount: number;
  completedCourseCount: number;
  currentStreak: number;
};

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/**
 * Share-card description. LinkedIn warns under 100 characters, so the stats
 * sentence is always included, even when the learner wrote a headline.
 */
export function profileShareDescription(stats: ShareStats): string {
  const summary = `${stats.name} has completed ${plural(
    stats.completedLessonCount,
    "lecture",
  )} across ${plural(
    stats.completedCourseCount,
    "course",
  )} on Certitube, with a ${plural(
    stats.currentStreak,
    "day",
  )} study streak and a public consistency heatmap.`;

  const headline = stats.headline?.trim();
  if (!headline) {
    return summary;
  }

  return `${headline} — ${summary}`;
}
