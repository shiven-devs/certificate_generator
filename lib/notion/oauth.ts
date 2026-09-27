import { SignJWT, jwtVerify } from "jose";
import { jwtSecretKey } from "@/lib/auth/jwt";
import { getEnv } from "@/lib/config/env";
import { AppError, ErrorCodes } from "@/lib/errors/app-error";

const NOTION_AUTHORIZE_URL = "https://api.notion.com/v1/oauth/authorize";
const NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token";
const NOTION_OAUTH_STATE_TYP = "notion-oauth";

export type NotionOAuthState = {
  userId: string;
  courseId: string | null;
};

export type NotionTokenSet = {
  accessToken: string;
  refreshToken: string;
  botId: string;
  workspaceId: string;
  workspaceName: string | null;
};

export function notionCallbackUrl(origin: string): string {
  return new URL("/api/notion/callback", origin).toString();
}

export async function createNotionOAuthState(
  payload: NotionOAuthState,
): Promise<string> {
  return new SignJWT({
    typ: NOTION_OAUTH_STATE_TYP,
    uid: payload.userId,
    cid: payload.courseId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(jwtSecretKey());
}

export async function readNotionOAuthState(
  state: string,
): Promise<NotionOAuthState | null> {
  try {
    const { payload } = await jwtVerify(state, jwtSecretKey(), {
      algorithms: ["HS256"],
    });
    if (payload.typ !== NOTION_OAUTH_STATE_TYP) {
      return null;
    }
    if (typeof payload.uid !== "string" || payload.uid.length < 1) {
      return null;
    }
    const courseId =
      typeof payload.cid === "string" && payload.cid.length > 0
        ? payload.cid
        : null;
    return { userId: payload.uid, courseId };
  } catch {
    return null;
  }
}

export function buildNotionAuthorizationUrl(input: {
  redirectUri: string;
  state: string;
}): string {
  const env = requireNotionConfig();
  const url = new URL(NOTION_AUTHORIZE_URL);
  url.searchParams.set("client_id", env.NOTION_CLIENT_ID);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("state", input.state);
  return url.toString();
}

export async function exchangeNotionAuthorizationCode(input: {
  code: string;
  redirectUri: string;
}): Promise<NotionTokenSet> {
  return requestNotionToken({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
  });
}

export async function refreshNotionAccessToken(
  refreshToken: string,
): Promise<NotionTokenSet> {
  return requestNotionToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

async function requestNotionToken(
  body: Record<string, string>,
): Promise<NotionTokenSet> {
  const env = requireNotionConfig();
  const encoded = Buffer.from(
    `${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch(NOTION_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${encoded}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error("Notion token request failed:", response.status);
    throw new AppError(
      ErrorCodes.NOTION_AUTH_FAILED,
      "Could not connect to Notion. Please try again.",
      401,
    );
  }

  const payload = (await response.json()) as {
    access_token?: unknown;
    refresh_token?: unknown;
    bot_id?: unknown;
    workspace_id?: unknown;
    workspace_name?: unknown;
  };

  if (
    typeof payload.access_token !== "string" ||
    typeof payload.refresh_token !== "string" ||
    typeof payload.bot_id !== "string" ||
    typeof payload.workspace_id !== "string"
  ) {
    throw new AppError(
      ErrorCodes.NOTION_AUTH_FAILED,
      "Could not connect to Notion. Please try again.",
      401,
    );
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    botId: payload.bot_id,
    workspaceId: payload.workspace_id,
    workspaceName:
      typeof payload.workspace_name === "string" ? payload.workspace_name : null,
  };
}

export function requireNotionConfig(): {
  NOTION_CLIENT_ID: string;
  NOTION_CLIENT_SECRET: string;
} {
  const env = getEnv();
  if (!env.NOTION_CLIENT_ID || !env.NOTION_CLIENT_SECRET) {
    throw new AppError(
      ErrorCodes.NOTION_NOT_CONFIGURED,
      "Notion sync is not available yet.",
      503,
    );
  }

  return {
    NOTION_CLIENT_ID: env.NOTION_CLIENT_ID,
    NOTION_CLIENT_SECRET: env.NOTION_CLIENT_SECRET,
  };
}
