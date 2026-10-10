import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/config/env";
import { jwtSecretKey } from "@/lib/auth/jwt";
import { secretsMatch } from "@/lib/auth/secrets";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";

export const ADMIN_COOKIE_NAME = "ct_admin_session";
const ADMIN_TOKEN_TTL = "12h";
const ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: getEnv().NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
  };
}

export function adminCredentialsMatch(adminId: string, password: string): boolean {
  const env = getEnv();
  const idMatches = secretsMatch(adminId, env.ADMIN_ID);
  const passwordMatches = secretsMatch(password, env.ADMIN_PASSWORD);
  return idMatches && passwordMatches;
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime(ADMIN_TOKEN_TTL)
    .sign(jwtSecretKey());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, jwtSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload.sub === "admin" && payload.role === "admin";
  } catch {
    return false;
  }
}

export async function setAdminCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, token, adminCookieOptions());
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, "", {
    ...adminCookieOptions(),
    maxAge: 0,
  });
}

export async function hasAdminSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }
  return verifyAdminToken(token);
}

export async function requireAdmin(): Promise<void> {
  if (!(await hasAdminSession())) {
    throw new AppError(
      ErrorCodes.UNAUTHENTICATED,
      "Admin sign-in is required.",
      401,
    );
  }
}
