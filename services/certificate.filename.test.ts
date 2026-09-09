import { describe, expect, it } from "vitest";
import { certificateFilename } from "@/services/certificate.service";

describe("certificateFilename", () => {
  it("keeps downloads in a safe ascii filename", () => {
    expect(certificateFilename('Ada "Lovelace"')).toBe(
      "ada-lovelace-certitube-certificate.pdf",
    );
  });

  it("falls back when the name has no ascii letters", () => {
    expect(certificateFilename("测试")).toBe("learner-certitube-certificate.pdf");
  });
});
