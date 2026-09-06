import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/jwt";
import { createSessionId } from "@/lib/auth/session-id";
import type { LoginInput, SignupInput } from "@/schemas/auth.schema";
import {
  clearSessionIfCurrent,
  createUser,
  findUserByEmailWithPassword,
  rotateSessionId,
  toPublicUser,
  type PublicUser,
} from "@/repositories/user.repository";

export type AuthResult = {
  user: PublicUser;
  token: string;
};

export async function signup(input: SignupInput): Promise<AuthResult> {
  const passwordHash = await hashPassword(input.password);
  const sessionId = createSessionId();

  try {
    const user = await createUser({
      name: input.name,
      email: input.email,
      passwordHash,
      currentSessionId: sessionId,
    });

    const token = await signAccessToken(user._id.toString(), sessionId);
    return { user: toPublicUser(user), token };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        ErrorCodes.EMAIL_IN_USE,
        "An account with this email already exists.",
        409,
      );
    }
    throw error;
  }
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await findUserByEmailWithPassword(input.email);
  const passwordHash = user?.passwordHash;

  if (!user || !passwordHash) {
    throw new AppError(
      ErrorCodes.INVALID_CREDENTIALS,
      "Email or password is incorrect.",
      401,
    );
  }

  const matches = await verifyPassword(input.password, passwordHash);
  if (!matches) {
    throw new AppError(
      ErrorCodes.INVALID_CREDENTIALS,
      "Email or password is incorrect.",
      401,
    );
  }

  const sessionId = createSessionId();
  await rotateSessionId(user._id.toString(), sessionId);
  const token = await signAccessToken(user._id.toString(), sessionId);
  return { user: toPublicUser(user), token };
}

export async function logoutCurrentSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  await clearSessionIfCurrent(userId, sessionId);
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 11000
  );
}
