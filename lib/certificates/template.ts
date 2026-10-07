import { readFile } from "fs/promises";
import path from "path";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";

export const CERTIFICATE_TEMPLATE_FILENAME = "certificate.png";
export const TEMPLATE_WIDTH = 1600;
export const TEMPLATE_HEIGHT = 958;
export const PAGE_WIDTH = 842;
export const PAGE_HEIGHT = PAGE_WIDTH * (TEMPLATE_HEIGHT / TEMPLATE_WIDTH);

export const NAME_INK = { r: 7 / 255, g: 31 / 255, b: 83 / 255 };

/** Layout is in template pixels, origin top-left of certificate.png. */
export const LAYOUT = {
  nameBaselineY: 570,
  nameSize: 22,
  nameMaxWidth: 980,
  sentenceLeft: 340,
  sentenceTop: 612,
  sentenceWidth: 980,
  sentenceHeight: 42,
  sentenceBaselineY: 640,
  sentenceSize: 14,
  qrLeft: 1344,
  qrTop: 594,
  qrSize: 96,
  qrPad: 6,
} as const;

export function pdfX(imageX: number): number {
  return (imageX / TEMPLATE_WIDTH) * PAGE_WIDTH;
}

export function pdfYFromTop(imageY: number): number {
  return PAGE_HEIGHT - (imageY / TEMPLATE_HEIGHT) * PAGE_HEIGHT;
}

export async function readCertificateTemplate(): Promise<Uint8Array> {
  const templatePath = path.join(
    process.cwd(),
    "public",
    CERTIFICATE_TEMPLATE_FILENAME,
  );

  try {
    return new Uint8Array(await readFile(templatePath));
  } catch {
    throw new AppError(
      ErrorCodes.INTERNAL_ERROR,
      "The certificate template is unavailable. Please try again later.",
      500,
    );
  }
}
