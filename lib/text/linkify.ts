export type LinkifiedPart =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string };

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;
const TRAILING_PUNCTUATION = /[),.:;!?]+$/u;
const MAX_HREF_LENGTH = 2048;

export function linkifyText(text: string): LinkifiedPart[] {
  if (!text) {
    return [];
  }

  const parts: LinkifiedPart[] = [];
  let cursor = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      parts.push({ type: "text", value: text.slice(cursor, start) });
    }

    const raw = match[0];
    const { candidate, trailing } = splitTrailingPunctuation(raw);
    const href = toSafeHttpHref(candidate);

    if (href) {
      parts.push({ type: "link", value: candidate, href });
    } else {
      parts.push({ type: "text", value: candidate });
    }

    if (trailing) {
      parts.push({ type: "text", value: trailing });
    }

    cursor = start + raw.length;
  }

  if (cursor < text.length) {
    parts.push({ type: "text", value: text.slice(cursor) });
  }

  return mergeAdjacentText(parts);
}

function splitTrailingPunctuation(raw: string): { candidate: string; trailing: string } {
  let candidate = raw;
  let trailing = "";

  while (candidate.length > 0) {
    const last = candidate.at(-1);
    if (!last) {
      break;
    }

    if (TRAILING_PUNCTUATION.test(last)) {
      candidate = candidate.slice(0, -1);
      trailing = last + trailing;
      continue;
    }

    if (last === ")" && countChar(candidate, "(") < countChar(candidate, ")")) {
      candidate = candidate.slice(0, -1);
      trailing = last + trailing;
      continue;
    }

    if (last === "]" && countChar(candidate, "[") < countChar(candidate, "]")) {
      candidate = candidate.slice(0, -1);
      trailing = last + trailing;
      continue;
    }

    break;
  }

  return { candidate, trailing };
}

function toSafeHttpHref(value: string): string | null {
  const candidate = value.toLowerCase().startsWith("www.") ? `https://${value}` : value;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }
  if (url.username || url.password) {
    return null;
  }
  if (url.href.length > MAX_HREF_LENGTH) {
    return null;
  }

  return url.href;
}

function countChar(value: string, char: string): number {
  let count = 0;
  for (const current of value) {
    if (current === char) {
      count += 1;
    }
  }
  return count;
}

function mergeAdjacentText(parts: LinkifiedPart[]): LinkifiedPart[] {
  const merged: LinkifiedPart[] = [];
  for (const part of parts) {
    const previous = merged.at(-1);
    if (part.type === "text" && previous?.type === "text") {
      previous.value += part.value;
      continue;
    }
    merged.push({ ...part });
  }
  return merged;
}
