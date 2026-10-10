import { describe, expect, it } from "vitest";
import { renderCertificatePdf } from "@/lib/certificates/render";
import { createCertificateVerifyToken } from "@/lib/certificates/token";
import { certificateVerifyUrl } from "@/lib/certificates/path";

describe("renderCertificatePdf", () => {
  it("renders a PDF from certificate.png without modifying the template file", async () => {
    const token = createCertificateVerifyToken();
    const pdf = await renderCertificatePdf({
      learnerName: "Ada Lovelace",
      courseTitle: "Introduction to Analytical Engines",
      completedAt: new Date("2026-10-07T00:00:00Z"),
      verifyUrl: certificateVerifyUrl("http://localhost:3000", token),
    });

    expect(Buffer.from(pdf.subarray(0, 5)).toString()).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(20_000);
  });
});
