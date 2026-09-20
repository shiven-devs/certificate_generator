import { getEnv } from "@/lib/config/env";

/**
 * Canonical public site origin for OAuth redirect_uri and post-login redirects.
 * Prefer APP_URL on Vercel so Google always sees the registered HTTPS origin.
 */
export function getPublicOrigin(request: Request): string {
  const configured = getEnv().APP_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    const proto = (forwardedProto?.split(",")[0]?.trim() || "https").replace(
      /:$/,
      "",
    );
    if (host) {
      return `${proto}://${host}`;
    }
  }

  return new URL(request.url).origin;
}
