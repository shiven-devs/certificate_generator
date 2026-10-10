import { describe, expect, it } from "vitest";
import {
  createNotionOAuthState,
  readNotionOAuthState,
} from "@/lib/notion/oauth";

process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/certitube";
process.env.JWT_SECRET ??= "test-secret-at-least-32-characters-long";
process.env.ADMIN_ID ??= "test-admin";
process.env.ADMIN_PASSWORD ??= "test-admin-password";

describe("Notion OAuth state", () => {
  it("round-trips the signed-in user and course", async () => {
    const state = await createNotionOAuthState({
      userId: "507f1f77bcf86cd799439011",
      courseId: "507f191e810c19729de860ea",
    });
    expect(await readNotionOAuthState(state)).toEqual({
      userId: "507f1f77bcf86cd799439011",
      courseId: "507f191e810c19729de860ea",
    });
  });

  it("rejects a tampered state value", async () => {
    const state = await createNotionOAuthState({
      userId: "507f1f77bcf86cd799439011",
      courseId: null,
    });
    expect(await readNotionOAuthState(`${state}x`)).toBeNull();
  });
});
