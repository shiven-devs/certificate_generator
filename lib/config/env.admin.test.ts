import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("admin env", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/certitube";
    process.env.JWT_SECRET = "test-secret-at-least-32-characters-long";
    delete process.env.ADMIN_ID;
    delete process.env.ADMIN_PASSWORD;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("lets the app start when admin credentials are unset", async () => {
    const { getEnv, isAdminAuthConfigured } = await import("@/lib/config/env");
    expect(getEnv().ADMIN_ID).toBeUndefined();
    expect(isAdminAuthConfigured()).toBe(false);
  });
});
