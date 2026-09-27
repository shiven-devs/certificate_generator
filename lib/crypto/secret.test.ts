import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

describe("encryptSecret", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/certitube";
    process.env.JWT_SECRET = "test-secret-at-least-32-characters-long";
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("round-trips a Notion access token", async () => {
    const { encryptSecret, decryptSecret } = await import("@/lib/crypto/secret");
    const token = "ntn_example_access_token_value";
    expect(decryptSecret(encryptSecret(token))).toBe(token);
  });

  it("rejects a tampered payload", async () => {
    const { encryptSecret, decryptSecret } = await import("@/lib/crypto/secret");
    const packed = encryptSecret("secret");
    const [iv, tag, data] = packed.split(".");
    expect(iv && tag && data).toBeTruthy();
    const flipped = data.endsWith("A") ? `${data.slice(0, -1)}B` : `${data.slice(0, -1)}A`;
    expect(() => decryptSecret(`${iv}.${tag}.${flipped}`)).toThrow();
  });
});
