/**
 * Lesson notes are split into pages. Page ids are UUIDs minted by whoever
 * creates the page (the browser for a new page, the server when migrating a
 * pre-pages note), and page titles are always derived from the body so there is
 * no separate title to keep in sync.
 */

export const MAX_NOTE_PAGES = 10;

const TITLE_MAX = 60;

export function fallbackPageTitle(index: number): string {
  return `Page ${index + 1}`;
}

export function derivePageTitle(body: string, index: number): string {
  for (const line of body.split("\n")) {
    const cleaned = stripMarkdownMarkers(line);
    if (cleaned) {
      return cleaned.length > TITLE_MAX
        ? `${cleaned.slice(0, TITLE_MAX - 1).trimEnd()}…`
        : cleaned;
    }
  }
  return fallbackPageTitle(index);
}

export function newNotePageId(): string {
  const webCrypto = globalThis.crypto;
  if (typeof webCrypto?.randomUUID === "function") {
    return webCrypto.randomUUID();
  }

  // Non-secure browser contexts have no randomUUID.
  const bytes = new Uint8Array(16);
  if (typeof webCrypto?.getRandomValues === "function") {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function stripMarkdownMarkers(line: string): string {
  return line
    .replace(/<[^>]*>/g, " ")
    .replace(/^\s*#{1,6}\s*/, "")
    .replace(/^\s*>\s*/, "")
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/, "")
    .replace(/\\([\s\S])/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
