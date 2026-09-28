import type { CoursePreview, CoursePreviewItem } from "@/lib/youtube/types";
import { isPreviewEnrollable } from "@/lib/youtube/playable";

/** Fail closed unless this share of watchable videos looks like learning content. */
export const MIN_LEARNING_SHARE = 0.8;

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

export function withLearningEnrollment(preview: CoursePreview): CoursePreview {
  const titleBlocked =
    preview.sourceType === "playlist" && isLikelyEntertainmentTitle(preview.title);
  const technical = preview.items.filter(isTechnicallyWatchable);
  const learning = preview.items.filter((item) => item.playable);
  const shareOk =
    technical.length === 0 ||
    learning.length / technical.length >= MIN_LEARNING_SHARE;
  const learningEligible = shareOk && !titleBlocked;

  return {
    ...preview,
    learningEligible,
    enrollable: learningEligible && isPreviewEnrollable(preview.items),
  };
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
