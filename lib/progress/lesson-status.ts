export type LessonWatchStatus = "completed" | "in-progress" | "not-visited";

export function lessonWatchStatus(input: {
  completed: boolean;
  watchedSeconds: number;
  lastPositionSeconds?: number;
  selected: boolean;
}): LessonWatchStatus {
  if (input.completed) {
    return "completed";
  }

  const started =
    input.watchedSeconds > 0 || (input.lastPositionSeconds ?? 0) > 0;

  if (input.selected || started) {
    return "in-progress";
  }

  return "not-visited";
}
