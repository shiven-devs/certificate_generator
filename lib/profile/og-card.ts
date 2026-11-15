export const OG_CARD_SIZE = { width: 1200, height: 630 } as const;
export const OG_CARD_ALT = "CertiTube learner profile";

export function profileCardImagePath(handle: string): string {
  return `/api/og/profile/${handle}`;
}
