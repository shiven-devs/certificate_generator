import { randomBytes } from "crypto";

export function createCertificateVerifyToken(): string {
  return randomBytes(32).toString("hex");
}
