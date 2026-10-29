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

/**
 * Same origin rules for server components, which read headers instead of a
 * Request. Falls back to a relative-safe localhost origin when no host header
 * is present.
 */
export function publicOriginFromHeaders(headerList: {
  get(name: string): string | null;
}): string {
  const configured = getEnv().APP_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  const forwardedHost = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!forwardedHost) {
    return "http://localhost:3000";
  }

  const host = forwardedHost.split(",")[0]?.trim();
  const proto = (
    headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https")
  ).replace(/:$/, "");

  return host ? `${proto}://${host}` : "http://localhost:3000";
}
