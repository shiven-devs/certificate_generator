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
import { fitText, formatCertificateDate } from "@/lib/certificates/text";

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
  page.drawRectangle({
    x: pdfX(LAYOUT.sentenceLeft),
    y: pdfYFromTop(LAYOUT.sentenceTop + LAYOUT.sentenceHeight),
    width: pdfX(LAYOUT.sentenceWidth),
    height: pdfX(LAYOUT.sentenceHeight),
    color: rgb(1, 1, 1),
  });
  drawCenteredText(
    page,
    sentence,
    LAYOUT.sentenceLeft + LAYOUT.sentenceWidth / 2,
    LAYOUT.sentenceBaselineY,
    LAYOUT.sentenceSize,
    lineFont,
    rgb(0, 0, 0),
    LAYOUT.sentenceWidth - 24,
  );

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
