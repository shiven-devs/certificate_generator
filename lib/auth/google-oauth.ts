import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTPayload } from "jose";
import { jwtSecretKey } from "@/lib/auth/jwt";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";
import { getEnv } from "@/lib/config/env";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
};

export function googleCallbackUrl(origin: string): string {
  return new URL("/api/auth/google/callback", origin).toString();
}

export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

const GOOGLE_OAUTH_STATE_TYP = "google-oauth";

export async function createSignedOAuthState(verifier: string): Promise<string> {
  return new SignJWT({ v: verifier, typ: GOOGLE_OAUTH_STATE_TYP })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(jwtSecretKey());
}

export async function readSignedOAuthState(state: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(state, jwtSecretKey(), {
      algorithms: ["HS256"],
    });
    if (payload.typ !== GOOGLE_OAUTH_STATE_TYP) {
      return null;
    }
    if (typeof payload.v !== "string" || payload.v.length < 32) {
      return null;
    }
    return payload.v;
  } catch {
    return null;
  }
}

export function buildGoogleAuthorizationUrl(input: {
  redirectUri: string;
  state: string;
  challenge: string;
}): string {
  const env = requireGoogleConfig();
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeGoogleAuthorizationCode(input: {
  code: string;
  redirectUri: string;
  verifier: string;
}): Promise<GoogleProfile> {
  const env = requireGoogleConfig();
  const body = new URLSearchParams({
    code: input.code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
    code_verifier: input.verifier,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    // Log Google's OAuth error code only — never tokens or secrets.
    try {
      const failure = (await response.json()) as { error?: unknown };
      if (typeof failure.error === "string") {
        console.error("Google token exchange failed:", failure.error);
      } else {
        console.error("Google token exchange failed:", response.status);
      }
    } catch {
      console.error("Google token exchange failed:", response.status);
    }
    throw new AppError(
      ErrorCodes.GOOGLE_AUTH_FAILED,
      "Google sign-in failed. Please try again.",
      401,
    );
  }

  const tokenPayload = (await response.json()) as { id_token?: unknown };
  if (typeof tokenPayload.id_token !== "string" || !tokenPayload.id_token) {
    throw new AppError(
      ErrorCodes.GOOGLE_AUTH_FAILED,
      "Google sign-in failed. Please try again.",
      401,
    );
  }

  let payload: JWTPayload;
  try {
    const verified = await jwtVerify(tokenPayload.id_token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = verified.payload;
  } catch {
    throw new AppError(
      ErrorCodes.GOOGLE_AUTH_FAILED,
      "Google sign-in failed. Please try again.",
      401,
    );
  }

  return googleProfileFromIdTokenPayload(payload);
}

export function googleProfileFromIdTokenPayload(payload: JWTPayload): GoogleProfile {
  const googleId = typeof payload.sub === "string" ? payload.sub : "";
  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const emailVerified =
    payload.email_verified === true || payload.email_verified === "true";
  const nameClaim = typeof payload.name === "string" ? payload.name.trim() : "";

  if (!googleId || !email) {
    throw new AppError(
      ErrorCodes.GOOGLE_AUTH_FAILED,
      "Google sign-in failed. Please try again.",
      401,
    );
  }

  if (!emailVerified) {
    throw new AppError(
      ErrorCodes.GOOGLE_EMAIL_UNVERIFIED,
      "Your Google email must be verified before you can sign in.",
      401,
    );
  }

  const fallbackName = email.split("@")[0] || "Learner";
  const name = (nameClaim || fallbackName).slice(0, 80);

  return { googleId, email, name };
}

function requireGoogleConfig(): {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
} {
  const env = getEnv();
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new AppError(
      ErrorCodes.GOOGLE_NOT_CONFIGURED,
      "Google sign-in is not available yet.",
      503,
    );
  }

  return {
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: clientSecret,
  };
}
