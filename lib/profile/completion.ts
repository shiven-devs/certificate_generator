import { creditedPercent } from "@/lib/progress/percent";
import { isCompletedByWatchTime } from "@/lib/progress/rules";

export type ProfileLessonInput = {
  youtubeVideoId: string;
  title: string;
  durationSeconds: number;
  order: number;
};

export type ProfileProgressInput = {
  youtubeVideoId: string;
  watchedSeconds: number;
};

export type ProfileLesson = {
  youtubeVideoId: string;
  title: string;
  durationSeconds: number;
  creditedPercent: number;
};

/**
 * A lesson counts as completed once the credited watch time crosses the same
 * threshold the player uses (75% of the runtime), so the profile never shows
 * more than the server actually credited.
 */
export function isLessonCompleted(
  watchedSeconds: number,
  durationSeconds: number,
): boolean {
  return isCompletedByWatchTime(Math.max(0, watchedSeconds), durationSeconds);
}

export function completedLessons(
  lessons: ProfileLessonInput[],
  itemProgress: ProfileProgressInput[],
): ProfileLesson[] {
  const watchedById = new Map(
    itemProgress.map((row) => [row.youtubeVideoId, Math.max(0, row.watchedSeconds)]),
  );

  return [...lessons]
    .sort((a, b) => a.order - b.order)
    .flatMap((lesson) => {
      const watched = watchedById.get(lesson.youtubeVideoId) ?? 0;
      if (!isLessonCompleted(watched, lesson.durationSeconds)) {
        return [];
      }
      return [
        {
          youtubeVideoId: lesson.youtubeVideoId,
          title: lesson.title,
          durationSeconds: lesson.durationSeconds,
          creditedPercent: creditedPercent(watched, lesson.durationSeconds),
        },
      ];
    });
}

/** Seconds of credited watch time across the lessons that are completed. */
export function completedWatchSeconds(
  lessons: ProfileLessonInput[],
  itemProgress: ProfileProgressInput[],
): number {
  const watchedById = new Map(
    itemProgress.map((row) => [row.youtubeVideoId, Math.max(0, row.watchedSeconds)]),
  );

  return lessons.reduce((sum, lesson) => {
    const watched = watchedById.get(lesson.youtubeVideoId) ?? 0;
    if (!isLessonCompleted(watched, lesson.durationSeconds)) {
      return sum;
    }
    return sum + Math.min(lesson.durationSeconds, watched);
  }, 0);
}

/** True when every lesson in the course has been completed. */
export function isCourseCompleted(
  lessons: ProfileLessonInput[],
  itemProgress: ProfileProgressInput[],
): boolean {
  if (lessons.length === 0) {
    return false;
  }
  return completedLessons(lessons, itemProgress).length === lessons.length;
}
