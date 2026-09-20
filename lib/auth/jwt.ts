import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "@/lib/config/env";

const TOKEN_TTL = "7d";

export function jwtSecretKey() {
  return new TextEncoder().encode(getEnv().JWT_SECRET);
}

export async function signAccessToken(
  userId: string,
  sessionId: string,
): Promise<string> {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(jwtSecretKey());
}

export async function verifyAccessToken(
  token: string,
): Promise<{ userId: string; sessionId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecretKey(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      return null;
    }

    if (typeof payload.sid !== "string" || payload.sid.length === 0) {
      return null;
    }

    return { userId: payload.sub, sessionId: payload.sid };
  } catch {
    return null;
  }
}
