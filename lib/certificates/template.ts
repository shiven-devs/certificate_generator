import { readFile } from "fs/promises";
import path from "path";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";

export const CERTIFICATE_TEMPLATE_FILENAME = "certificate.png";
export const TEMPLATE_WIDTH = 1600;
export const TEMPLATE_HEIGHT = 958;
export const PAGE_WIDTH = 842;
export const PAGE_HEIGHT = PAGE_WIDTH * (TEMPLATE_HEIGHT / TEMPLATE_WIDTH);

export const NAME_INK = { r: 7 / 255, g: 31 / 255, b: 83 / 255 };
export const BODY_INK = { r: 0.08, g: 0.08, b: 0.08 };

/** Layout is in template pixels, origin top-left of certificate.png. */
export const LAYOUT = {
  nameBaselineY: 570,
  nameSize: 22,
  nameMaxWidth: 980,
  courseBaselineY: 628,
  courseSize: 11,
  courseCenterX: 924,
  courseMaxWidth: 270,
  dateBaselineY: 628,
  dateSize: 11,
  dateCenterX: 1224,
  dateMaxWidth: 180,
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
