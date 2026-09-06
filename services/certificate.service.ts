import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { findEnrollmentByIdWithCourse } from "@/repositories/enrollment.repository";
import { listMyEnrollments } from "@/services/enrollment.service";
import type { CourseDocument } from "@/models/course.model";
import type { PublicUser } from "@/repositories/user.repository";
import { certificateParamsSchema } from "@/schemas/certificate.schema";
import { certificatePath } from "@/lib/certificates/path";

export async function listMyCertificates(userId: string) {
  const enrollments = await listMyEnrollments(userId);
  return enrollments.filter((item) => item.enrollment.status === "completed");
}

export async function issueCertificate(input: {
  user: PublicUser;
  enrollmentId: string;
}) {
  const enrollment = await requireCompletedEnrollment(input);
  const url = enrollment.certificateUrl ?? certificatePath(enrollment._id.toString());
  if (!enrollment.certificateUrl) {
    enrollment.certificateUrl = url;
    await enrollment.save();
  }
  return { certificateUrl: url };
}

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;

export async function generateCertificatePdf(input: {
  user: PublicUser;
  enrollmentId: string;
}): Promise<Uint8Array> {
  const enrollment = await requireCompletedEnrollment(input);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const muted = rgb(0.38, 0.44, 0.54);
  const ink = rgb(0.06, 0.09, 0.16);
  const accent = rgb(0.31, 0.27, 0.9);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: rgb(0.97, 0.98, 1),
  });
  page.drawRectangle({
    x: 38,
    y: 38,
    width: PAGE_WIDTH - 76,
    height: PAGE_HEIGHT - 76,
    borderColor: accent,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 54,
    y: 54,
    width: PAGE_WIDTH - 108,
    height: PAGE_HEIGHT - 108,
    borderColor: rgb(0.82, 0.85, 0.91),
    borderWidth: 1,
  });

  drawCenteredText(page, "WatchProof", 500, 22, bold, accent);
  drawCenteredText(page, "Certificate of Completion", 438, 34, bold, ink);
  drawCenteredText(page, "This certifies that", 382, 15, regular, muted);
  drawCenteredText(page, input.user.name, 336, 32, bold, ink, 620);
  drawCenteredText(page, "completed the course", 286, 15, regular, muted);
  drawCenteredText(page, enrollment.course.title, 244, 25, bold, ink, 680);

  const completedAt = enrollment.completedAt ?? new Date();
  drawCenteredText(
    page,
    `Completed on ${completedAt.toLocaleDateString("en", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    176,
    14,
    regular,
    muted,
  );

  page.drawLine({
    start: { x: 272, y: 130 },
    end: { x: 570, y: 130 },
    thickness: 1,
    color: rgb(0.7, 0.74, 0.82),
  });
  drawCenteredText(page, "Server-validated learning progress", 105, 12, regular, muted);

  return pdf.save();
}

export function certificateFilename(userName: string): string {
  const safe = userName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${safe || "learner"}-watchproof-certificate.pdf`;
}

async function requireCompletedEnrollment(input: {
  user: PublicUser;
  enrollmentId: string;
}) {
  const parsed = certificateParamsSchema.safeParse({
    enrollmentId: input.enrollmentId,
  });
  if (!parsed.success) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Certificate not found.", 404);
  }

  const enrollment = await findEnrollmentByIdWithCourse(
    input.user.id,
    parsed.data.enrollmentId,
  );
  if (!enrollment || !enrollment.course) {
    throw new AppError(ErrorCodes.NOT_FOUND, "Certificate not found.", 404);
  }

  if (enrollment.status !== "completed") {
    throw new AppError(
      ErrorCodes.FORBIDDEN,
      "Complete the course before downloading a certificate.",
      403,
    );
  }

  return enrollment as typeof enrollment & { course: CourseDocument };
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
  maxWidth = PAGE_WIDTH - 160,
) {
  const fitted = fitText(text, size, font, maxWidth);
  const width = font.widthOfTextAtSize(fitted.text, fitted.size);
  page.drawText(fitted.text, {
    x: (PAGE_WIDTH - width) / 2,
    y,
    size: fitted.size,
    font,
    color,
  });
}

function fitText(
  text: string,
  size: number,
  font: PDFFont,
  maxWidth: number,
) {
  let nextSize = size;
  while (nextSize > 10 && font.widthOfTextAtSize(text, nextSize) > maxWidth) {
    nextSize -= 1;
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
