import { describe, expect, it } from "vitest";
import {
  passwordMeetsPolicy,
  PASSWORD_RULES,
} from "@/lib/auth/password-policy";
import { loginSchema, signupSchema } from "@/schemas/auth.schema";

describe("password policy", () => {
  it("accepts a password with mixed case, a number, and a symbol", () => {
    expect(passwordMeetsPolicy("GoodPass1!")).toBe(true);
  });

  it("rejects passwords missing required character classes", () => {
    expect(passwordMeetsPolicy("goodpass1!")).toBe(false);
    expect(passwordMeetsPolicy("GOODPASS1!")).toBe(false);
    expect(passwordMeetsPolicy("GoodPass!")).toBe(false);
    expect(passwordMeetsPolicy("GoodPass1")).toBe(false);
    expect(passwordMeetsPolicy("Short1!")).toBe(false);
  });

  it("exposes the standard website-style rules", () => {
    expect(PASSWORD_RULES.map((rule) => rule.id)).toEqual([
      "length",
      "lowercase",
      "uppercase",
      "number",
      "special",
    ]);
  });
});

describe("signupSchema password", () => {
  const base = {
    name: "Ada Lovelace",
    email: "ada@example.com",
  };

  it("accepts a strong password", () => {
    const parsed = signupSchema.safeParse({
      ...base,
      password: "GoodPass1!",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a weak password", () => {
    const parsed = signupSchema.safeParse({
      ...base,
      password: "password",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("loginSchema password", () => {
  it("does not re-apply signup strength rules", () => {
    const parsed = loginSchema.safeParse({
      email: "ada@example.com",
      password: "legacy",
    });
    expect(parsed.success).toBe(true);
  });
});
