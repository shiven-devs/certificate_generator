import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { fitText, formatCertificateDate, wrapLines } from "@/lib/certificates/text";

describe("formatCertificateDate", () => {
  it("uses a long English date", () => {
    expect(formatCertificateDate(new Date("2026-10-07T12:00:00Z"))).toMatch(/2026/);
  });
});

describe("wrapLines", () => {
  it("moves overflow words onto the next line instead of truncating", async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const sentence =
      "for successfully completing the course How Senior Engineers Actually Think About System Design & Architecture | Full Course on October 10, 2026";
    const wrapped = wrapLines(sentence, 14, font, 280, 3);

    expect(wrapped.lines.length).toBeGreaterThan(1);
    expect(wrapped.lines.join(" ")).toBe(sentence);
    expect(wrapped.lines.some((line) => line.endsWith("..."))).toBe(false);
    for (const line of wrapped.lines) {
      expect(font.widthOfTextAtSize(line, wrapped.size)).toBeLessThanOrEqual(280);
    }
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
