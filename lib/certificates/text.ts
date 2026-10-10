import type { PDFFont } from "pdf-lib";

export function fitText(
  text: string,
  size: number,
  font: PDFFont,
  maxWidth: number,
  minSize = 9,
) {
  let nextSize = size;
  while (nextSize > minSize && font.widthOfTextAtSize(text, nextSize) > maxWidth) {
    nextSize -= 0.5;
  }

  if (font.widthOfTextAtSize(text, nextSize) <= maxWidth) {
    return { text, size: nextSize };
  }

  let clipped = text;
  while (
    clipped.length > 1 &&
    font.widthOfTextAtSize(`${clipped}...`, nextSize) > maxWidth
  ) {
    clipped = clipped.slice(0, -1);
  }

  return { text: `${clipped}...`, size: nextSize };
}

export function wrapLines(
  text: string,
  size: number,
  font: PDFFont,
  maxWidth: number,
  maxLines: number,
  minSize = 11,
): { lines: string[]; size: number } {
  let nextSize = size;
  while (nextSize > minSize) {
    const lines = breakLines(text, nextSize, font, maxWidth);
    if (lines.length <= maxLines) {
      return { lines, size: nextSize };
    }
    nextSize -= 0.5;
  }

  return { lines: breakLines(text, nextSize, font, maxWidth), size: nextSize };
}

function breakLines(
  text: string,
  size: number,
  font: PDFFont,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }
    current = fitWord(word, size, font, maxWidth, lines);
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
}

function fitWord(
  word: string,
  size: number,
  font: PDFFont,
  maxWidth: number,
  lines: string[],
): string {
  if (font.widthOfTextAtSize(word, size) <= maxWidth) {
    return word;
  }

  let chunk = "";
  for (const char of word) {
    const next = `${chunk}${char}`;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      chunk = next;
      continue;
    }
    if (chunk) {
      lines.push(chunk);
    }
    chunk = char;
  }

  return chunk;
}

export function formatCertificateDate(value: Date): string {
  return value.toLocaleDateString("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
