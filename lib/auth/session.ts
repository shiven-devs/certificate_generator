import { cookies } from "next/headers";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { AUTH_COOKIE_NAME, clearAuthCookie } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { sessionIdsMatch } from "@/lib/auth/session-id";
import { connectDb } from "@/lib/db/connect";
import {
  findUserById,
  toPublicUser,
  type PublicUser,
} from "@/repositories/user.repository";

export const SESSION_INVALIDATED_MESSAGE =
  "You were logged out because your account was used on another device.";

export type SessionState =
  | { status: "anonymous" }
  | { status: "authenticated"; user: PublicUser }
  | { status: "invalidated" };

export async function resolveSession(): Promise<SessionState> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return { status: "anonymous" };
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return { status: "anonymous" };
  }

  await connectDb();
  const user = await findUserById(payload.userId);
  if (!user) {
    return { status: "anonymous" };
  }

  if (!sessionIdsMatch(user.currentSessionId, payload.sessionId)) {
    return { status: "invalidated" };
  }

  return { status: "authenticated", user: toPublicUser(user) };
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const session = await resolveSession();
  return session.status === "authenticated" ? session.user : null;
}

export async function requireUser(): Promise<PublicUser> {
  const session = await resolveSession();

  if (session.status === "invalidated") {
    await clearAuthCookie();
    throw new AppError(
      ErrorCodes.SESSION_INVALIDATED,
      SESSION_INVALIDATED_MESSAGE,
      401,
    );
  }

  if (session.status !== "authenticated") {
    throw new AppError(
      ErrorCodes.UNAUTHENTICATED,
      "You need to sign in to continue.",
      401,
    );
  }

  return session.user;
}
