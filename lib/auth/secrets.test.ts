import { describe, expect, it } from "vitest";
import { secretsMatch } from "@/lib/auth/secrets";

describe("secretsMatch", () => {
  it("matches identical secrets", () => {
    expect(secretsMatch("admin-secret-value", "admin-secret-value")).toBe(true);
  });

  it("rejects a different secret of the same length", () => {
    expect(secretsMatch("admin-secret-value", "admin-secret-valuE")).toBe(false);
  });

  it("rejects a different length", () => {
    expect(secretsMatch("admin", "administrator")).toBe(false);
  });
});
