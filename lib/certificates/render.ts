import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { createQrPng } from "@/lib/certificates/qr";
import {
  LAYOUT,
  NAME_INK,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  TEMPLATE_WIDTH,
  pdfX,
  pdfYFromTop,
  readCertificateTemplate,
} from "@/lib/certificates/template";
import { fitText, formatCertificateDate, wrapLines } from "@/lib/certificates/text";

export async function renderCertificatePdf(input: {
  learnerName: string;
  courseTitle: string;
  completedAt: Date;
  verifyUrl: string;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const template = await pdf.embedPng(await readCertificateTemplate());
  page.drawImage(template, {
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  });

  const lineFont = await pdf.embedFont(StandardFonts.Helvetica);
  const nameFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const nameColor = rgb(NAME_INK.r, NAME_INK.g, NAME_INK.b);

  drawCenteredText(
    page,
    input.learnerName,
    TEMPLATE_WIDTH / 2,
    LAYOUT.nameBaselineY,
    LAYOUT.nameSize,
    nameFont,
    nameColor,
    LAYOUT.nameMaxWidth,
  );
  const sentence = `for successfully completing the course ${input.courseTitle} on ${formatCertificateDate(input.completedAt)}`;
  drawWrappedSentence(page, sentence, lineFont);

  await drawVerifyQr(pdf, page, input.verifyUrl);
  return pdf.save();
}

async function drawVerifyQr(
  pdf: PDFDocument,
  page: PDFPage,
  verifyUrl: string,
) {
  const qr = await pdf.embedPng(await createQrPng(verifyUrl));
  const pad = pdfX(LAYOUT.qrPad);
  const size = pdfX(LAYOUT.qrSize);
  const x = pdfX(LAYOUT.qrLeft);
  const y = pdfYFromTop(LAYOUT.qrTop + LAYOUT.qrSize);

  page.drawRectangle({
    x: x - pad,
    y: y - pad,
    width: size + pad * 2,
    height: size + pad * 2,
    color: rgb(1, 1, 1),
  });
  page.drawImage(qr, { x, y, width: size, height: size });
}

function drawWrappedSentence(page: PDFPage, sentence: string, font: PDFFont) {
  const maxWidth = pdfX(LAYOUT.sentenceWidth - 16);
  const wrapped = wrapLines(
    sentence,
    LAYOUT.sentenceSize,
    font,
    maxWidth,
    LAYOUT.sentenceMaxLines,
  );
  const lineGap =
    wrapped.lines.length <= 1
      ? LAYOUT.sentenceLineGap
      : Math.min(
          LAYOUT.sentenceLineGap,
          (694 - 14 - LAYOUT.sentenceBaselineY) / (wrapped.lines.length - 1),
        );
  const lastBaseline =
    LAYOUT.sentenceBaselineY + (wrapped.lines.length - 1) * lineGap;
  const coverBottom = lastBaseline + 14;

  page.drawRectangle({
    x: pdfX(LAYOUT.sentenceLeft),
    y: pdfYFromTop(coverBottom),
    width: pdfX(LAYOUT.sentenceWidth),
    height: pdfX(coverBottom - LAYOUT.sentenceTop),
    color: rgb(1, 1, 1),
  });

  const centerX = LAYOUT.sentenceLeft + LAYOUT.sentenceWidth / 2;
  wrapped.lines.forEach((line, index) => {
    const width = font.widthOfTextAtSize(line, wrapped.size);
    page.drawText(line, {
      x: pdfX(centerX) - width / 2,
      y: pdfYFromTop(LAYOUT.sentenceBaselineY + index * lineGap),
      size: wrapped.size,
      font,
      color: rgb(0, 0, 0),
    });
  });
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  imageCenterX: number,
  imageBaselineY: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
  maxImageWidth: number,
) {
  const maxWidth = pdfX(maxImageWidth);
  const fitted = fitText(text, size, font, maxWidth);
  const width = font.widthOfTextAtSize(fitted.text, fitted.size);
  page.drawText(fitted.text, {
    x: pdfX(imageCenterX) - width / 2,
    y: pdfYFromTop(imageBaselineY),
    size: fitted.size,
    font,
    color,
  });
}
