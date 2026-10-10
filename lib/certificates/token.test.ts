import { describe, expect, it } from "vitest";
import { createCertificateVerifyToken } from "@/lib/certificates/token";
import { certificateVerifyTokenSchema } from "@/schemas/certificate.schema";

describe("createCertificateVerifyToken", () => {
  it("creates an unguessable 64-character hex token", () => {
    const token = createCertificateVerifyToken();
    expect(certificateVerifyTokenSchema.safeParse({ token }).success).toBe(true);
    expect(createCertificateVerifyToken()).not.toBe(token);
  });
});
