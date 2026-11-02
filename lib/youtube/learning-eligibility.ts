import type { CoursePreview, CoursePreviewItem } from "@/lib/youtube/types";
import { isPreviewEnrollable } from "@/lib/youtube/playable";

/** Fail closed unless this share of watchable videos looks like learning content. */
export const MIN_LEARNING_SHARE = 0.8;

/**
 * A playlist that reads as a course carries its quieter videos, but it still
 * has to be mostly learning content, so a course title cannot smuggle in a
 * dump of entertainment.
 */
export const MIN_SERIES_LEARNING_SHARE = 0.5;

export const NOT_LEARNING_CONTENT_MESSAGE =
  "This looks like entertainment, not a course. Paste a lecture, tutorial, or educational playlist.";

export type LearningSignals = {
  title: string;
  description?: string;
  categoryId?: string | null;
  tags?: string[];
};

const LEARNING_CATEGORY_IDS = new Set(["26", "27", "28"]);
const ENTERTAINMENT_CATEGORY_IDS = new Set([
  "1",
  "10",
  "17",
  "20",
  "23",
  "24",
  "43",
  "44",
]);

const LEARNING_PATTERNS: RegExp[] = [
  /\btutorial\b/,
  /\bcourse\b/,
  /\blecture\b/,
  /\blesson\b/,
  /\bexplained\b/,
  /\blearn(?:ing)?\b/,
  /\bbootcamp\b/,
  /\bcurriculum\b/,
  /\bexam\b/,
  /\bclass(?:es)?\b/,
  /\bwalkthrough\b/,
  /\bcrash\s*course\b/,
  /\bhow\s*to\b/,
  /\bintroduction\b/,
  /\bintro\s+to\b/,
  /\bprogramming\b/,
  /\bstudy\b/,
  /\bchapter\b/,
  /\bmodule\b/,
  /\bhomework\b/,
  /\bcertification\b/,
  /\bsyllabus\b/,
  /\bworkshop\b/,
  /\btraining\b/,
  /\bfundamentals\b/,
  /\bbeginner\b/,
  /\balgorithms?\b/,
  /\bdata\s*structures?\b/,
  // Project-based teaching rarely says "tutorial" in the title.
  /\bbuild\s+(?:your\s+own|my\s+own|a|an)\b/,
  /\bfrom\s+scratch\b/,
  /\bimplement(?:ing|ation|ations|ed|s)?\b/,
  /\bdeep\s*dive\b/,
  /\bguide\b/,
  /\bbasics?\b/,
  /\bconcepts?\b/,
  /\bproject\b/,
  /\bcod(?:e|ing)\b/,
  /\bsystem\s+design\b/,
  /\bc\+\+/,
  /\bpython\b/,
  /\bjava(?:script)?\b/,
  /\bdatabase\b/,
  /\bapi\b/,
];

const STRONG_ENTERTAINMENT_TITLE_PATTERNS: RegExp[] = [
  /\bofficial\s+(?:music\s+)?video\b/,
  /\bmusic\s+video\b/,
  /\bfull\s+album\b/,
  /\bfull\s+movie\b/,
  /\bweb\s+series\b/,
  /\btv\s+series\b/,
  /\bepisode\s*\d+\b/,
  /\bseason\s*\d+\b/,
  /\blive\s+concert\b/,
  /\bofficial\s+audio\b/,
  /\btrailer\b/,
];

const ENTERTAINMENT_PATTERNS: RegExp[] = [
  ...STRONG_ENTERTAINMENT_TITLE_PATTERNS,
  /\bost\b/,
  /\bsoundtrack\b/,
  /\blyrics?\b/,
  /\bmv\b/,
  /\bnetflix\b/,
  /\banime\b/,
];

export function isLikelyEntertainmentTitle(title: string): boolean {
  return countPatternHits(normalize(title), STRONG_ENTERTAINMENT_TITLE_PATTERNS) > 0;
}

export function classifyLearningContent(signals: LearningSignals): boolean {
  const title = normalize(signals.title);
  if (isLikelyEntertainmentTitle(signals.title)) {
    return false;
  }

  const categoryId = signals.categoryId?.trim() ?? "";
  if (LEARNING_CATEGORY_IDS.has(categoryId)) {
    return true;
  }
  if (ENTERTAINMENT_CATEGORY_IDS.has(categoryId)) {
    return false;
  }

  const description = normalize(signals.description ?? "").slice(0, 500);
  const tags = normalize((signals.tags ?? []).join(" "));

  const score =
    countPatternHits(title, LEARNING_PATTERNS) * 2 +
    countPatternHits(description, LEARNING_PATTERNS) +
    countPatternHits(tags, LEARNING_PATTERNS) -
    countPatternHits(title, ENTERTAINMENT_PATTERNS) * 3 -
    countPatternHits(description, ENTERTAINMENT_PATTERNS) * 2 -
    countPatternHits(tags, ENTERTAINMENT_PATTERNS);

  return score >= 2;
}

export function isTechnicallyWatchable(item: CoursePreviewItem): boolean {
  return item.playable || item.issue === "not_learning";
}

/** What the caller knows before the learning rules derive the rest. */
export type LearningDraft = Omit<
  CoursePreview,
  "enrollable" | "learningEligible" | "totalDurationSeconds"
>;

export function withLearningEnrollment(
  draft: LearningDraft,
  seriesDescription?: string,
): CoursePreview {
  const titleBlocked =
    draft.sourceType === "playlist" && isLikelyEntertainmentTitle(draft.title);
  const technical = draft.items.filter(isTechnicallyWatchable);
  const learning = draft.items.filter((item) => item.playable);
  const learningShare =
    technical.length === 0 ? 1 : learning.length / technical.length;

  // A playlist is judged as a series. When its own title and description read
  // as a course, the videos inside it are lessons too, so a part named only
  // "Part 11 - Writing Hash Command Handlers" is not dropped for carrying no
  // keywords of its own while its siblings pass.
  const seriesIsCourse =
    draft.sourceType === "playlist" &&
    !titleBlocked &&
    learningShare >= MIN_SERIES_LEARNING_SHARE &&
    classifyLearningContent({ title: draft.title, description: seriesDescription });

  const learningEligible =
    !titleBlocked && (seriesIsCourse || learningShare >= MIN_LEARNING_SHARE);
  const items = seriesIsCourse ? draft.items.map(carrySeriesVerdict) : draft.items;

  return {
    ...draft,
    items,
    totalDurationSeconds: items
      .filter((item) => item.playable)
      .reduce((total, item) => total + item.durationSeconds, 0),
    learningEligible,
    enrollable: learningEligible && isPreviewEnrollable(items),
  };
}

/** Only the learning verdict is inherited; a technical issue still stands. */
function carrySeriesVerdict(item: CoursePreviewItem): CoursePreviewItem {
  if (item.issue !== "not_learning") {
    return item;
  }
  return { ...item, playable: true, issue: null };
}

function normalize(value: string): string {
  return value.toLowerCase();
}

function countPatternHits(text: string, patterns: RegExp[]): number {
  if (!text) {
    return 0;
  }
  let hits = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      hits += 1;
    }
  }
  return hits;
}
