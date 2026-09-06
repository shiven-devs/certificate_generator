import { timingSafeEqual } from "node:crypto";

export function createSessionId(): string {
  return crypto.randomUUID();
}

export function sessionIdsMatch(
  stored: string | null | undefined,
  presented: string | null | undefined,
): boolean {
  if (!stored || !presented) {
    return false;
  }

  const left = Buffer.from(stored);
  const right = Buffer.from(presented);
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}
