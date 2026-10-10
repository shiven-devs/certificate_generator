import { timingSafeEqual } from "node:crypto";

export function secretsMatch(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);

  if (leftBytes.length !== rightBytes.length) {
    timingSafeEqual(leftBytes, leftBytes);
    return false;
  }

  return timingSafeEqual(leftBytes, rightBytes);
}
