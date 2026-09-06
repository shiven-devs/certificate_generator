import { describe, expect, it } from "vitest";
import { parseIso8601Duration } from "@/lib/youtube/duration";

describe("parseIso8601Duration", () => {
  it("parses hours, minutes, and seconds", () => {
    expect(parseIso8601Duration("PT1H2M3S")).toBe(3723);
  });

  it("parses minutes only", () => {
    expect(parseIso8601Duration("PT15M")).toBe(900);
  });

  it("returns null for invalid values", () => {
    expect(parseIso8601Duration("15:00")).toBeNull();
  });
});
