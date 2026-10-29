export const PROFILE_HANDLE_MIN = 3;
export const PROFILE_HANDLE_MAX = 30;

const HANDLE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const RESERVED = new Set([
  "admin",
  "api",
  "certificates",
  "courses",
  "dashboard",
  "login",
  "logout",
  "me",
  "new",
  "profile",
  "settings",
  "signup",
  "support",
  "u",
  "verify",
]);

export function isValidProfileHandle(value: string): boolean {
  return (
    value.length >= PROFILE_HANDLE_MIN &&
    value.length <= PROFILE_HANDLE_MAX &&
    HANDLE.test(value) &&
    !RESERVED.has(value)
  );
}

export function normalizeProfileHandle(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  return isValidProfileHandle(normalized) ? normalized : null;
}

/** Strips a name or email local part down to handle characters. */
export function slugifyHandle(value: string): string {
  return value
    .toLowerCase()
    .split("@")[0]!
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, PROFILE_HANDLE_MAX)
    .replace(/-+$/g, "");
}

/**
 * Handle candidates to try in order. Each is a valid handle, so the caller can
 * take the first one the database accepts.
 */
export function profileHandleCandidates(input: {
  name: string;
  email: string;
  attempt: number;
}): string[] {
  const bases = [slugifyHandle(input.name), slugifyHandle(input.email), "learner"];
  const candidates: string[] = [];

  for (const base of bases) {
    const seed = base.length >= PROFILE_HANDLE_MIN ? base : `${base}-learner`;
    for (const suffix of suffixesFor(input.attempt)) {
      const trimmed = seed.slice(0, PROFILE_HANDLE_MAX - suffix.length).replace(/-+$/g, "");
      const candidate = `${trimmed}${suffix}`;
      if (isValidProfileHandle(candidate) && !candidates.includes(candidate)) {
        candidates.push(candidate);
      }
    }
  }

  return candidates;
}

function suffixesFor(attempt: number): string[] {
  if (attempt <= 0) {
    return ["", `-${randomDigits(2)}`];
  }
  return [`-${randomDigits(attempt + 2)}`];
}

function randomDigits(length: number): string {
  let digits = "";
  for (let index = 0; index < length; index += 1) {
    digits += String(Math.floor(Math.random() * 10));
  }
  return digits;
}
