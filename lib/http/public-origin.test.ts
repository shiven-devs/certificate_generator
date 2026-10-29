import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("getPublicOrigin", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/certitube";
    process.env.JWT_SECRET = "test-secret-at-least-32-characters-long";
    process.env.ADMIN_ID = "test-admin";
    process.env.ADMIN_PASSWORD = "test-admin-password";
    delete process.env.APP_URL;
  });

  afterEach(() => {
    vi.resetModules();
    delete process.env.APP_URL;
  });

  it("prefers APP_URL when set", async () => {
    process.env.APP_URL = "https://certitube.vercel.app/";
    const { getPublicOrigin } = await import("@/lib/http/public-origin");
    const request = new Request("http://localhost:3000/api/auth/google");
    expect(getPublicOrigin(request)).toBe("https://certitube.vercel.app");
  });

  it("falls back to forwarded headers", async () => {
    const { getPublicOrigin } = await import("@/lib/http/public-origin");
    const request = new Request("http://127.0.0.1/api/auth/google", {
      headers: {
        "x-forwarded-host": "certitube.vercel.app",
        "x-forwarded-proto": "https",
      },
    });
    expect(getPublicOrigin(request)).toBe("https://certitube.vercel.app");
  });
});

describe("publicOriginFromHeaders", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/certitube";
    process.env.JWT_SECRET = "test-secret-at-least-32-characters-long";
    delete process.env.APP_URL;
  });

  afterEach(() => {
    vi.resetModules();
    delete process.env.APP_URL;
  });

  it("prefers APP_URL when set", async () => {
    process.env.APP_URL = "https://certitube.vercel.app/";
    const { publicOriginFromHeaders } = await import("@/lib/http/public-origin");
    expect(publicOriginFromHeaders(new Headers({ host: "localhost:3000" }))).toBe(
      "https://certitube.vercel.app",
    );
  });

  it("uses http for a local host header", async () => {
    const { publicOriginFromHeaders } = await import("@/lib/http/public-origin");
    expect(publicOriginFromHeaders(new Headers({ host: "localhost:3000" }))).toBe(
      "http://localhost:3000",
    );
  });

  it("uses the forwarded proto and host behind a proxy", async () => {
    const { publicOriginFromHeaders } = await import("@/lib/http/public-origin");
    const headers = new Headers({
      host: "internal:3000",
      "x-forwarded-host": "certitube.vercel.app",
      "x-forwarded-proto": "https",
    });
    expect(publicOriginFromHeaders(headers)).toBe("https://certitube.vercel.app");
  });
});
