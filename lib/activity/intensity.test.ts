import { describe, expect, it } from "vitest";
import { intensityLevel } from "@/lib/activity/intensity";

describe("heatmap intensity", () => {
  it("maps daily lesson volume onto five levels", () => {
    expect(intensityLevel(0)).toBe(0);
    expect(intensityLevel(1)).toBe(1);
    expect(intensityLevel(3)).toBe(2);
    expect(intensityLevel(6)).toBe(3);
    expect(intensityLevel(7)).toBe(4);
  });
});
