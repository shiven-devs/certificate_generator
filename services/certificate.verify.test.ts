import { describe, expect, it } from "vitest";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { getPublicCertificateDetails } from "@/services/certificate.service";

describe("getPublicCertificateDetails", () => {
  it("does not treat malformed tokens as existing certificates", async () => {
    try {
      await getPublicCertificateDetails("not-a-token");
      throw new Error("expected lookup to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe(ErrorCodes.NOT_FOUND);
    }
  });
});
