import type { PDFFont } from "pdf-lib";

export function fitText(
  text: string,
  size: number,
  font: PDFFont,
  maxWidth: number,
  minSize = 9,
) {
  let nextSize = size;
  while (nextSize > minSize && font.widthOfTextAtSize(text, nextSize) > maxWidth) {
    nextSize -= 0.5;
  }

  if (font.widthOfTextAtSize(text, nextSize) <= maxWidth) {
    return { text, size: nextSize };
  }

  let clipped = text;
  while (
    clipped.length > 1 &&
    font.widthOfTextAtSize(`${clipped}...`, nextSize) > maxWidth
  ) {
    clipped = clipped.slice(0, -1);
  }

  return { text: `${clipped}...`, size: nextSize };
}

export function formatCertificateDate(value: Date): string {
  return value.toLocaleDateString("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
