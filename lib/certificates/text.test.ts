import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { fitText, formatCertificateDate } from "@/lib/certificates/text";

describe("formatCertificateDate", () => {
  it("uses a long English date", () => {
    expect(formatCertificateDate(new Date("2026-10-07T12:00:00Z"))).toMatch(/2026/);
  });
});

describe("fitText", () => {
  it("shrinks and then clips text that cannot fit", async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.TimesRoman);
    const fitted = fitText("A very long course title that should not overflow the certificate line", 14, font, 80);
    expect(fitted.text.endsWith("...")).toBe(true);
    expect(font.widthOfTextAtSize(fitted.text, fitted.size)).toBeLessThanOrEqual(80);
  });
});
