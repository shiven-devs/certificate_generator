import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getEnv } from "@/lib/config/env";

function encryptionKey(): Buffer {
  return createHash("sha256")
    .update(`${getEnv().JWT_SECRET}:notion-token`)
    .digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(packed: string): string {
  const [ivPart, tagPart, dataPart] = packed.split(".");
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("Invalid secret payload");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
