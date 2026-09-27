import { Types } from "mongoose";
import { NotionConnection } from "@/models/notion-connection.model";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secret";
import type { NotionTokenSet } from "@/lib/notion/oauth";

export type PublicNotionConnection = {
  connected: true;
  workspaceName: string | null;
  connectedAt: string;
};

export type StoredNotionTokens = NotionTokenSet & {
  workspaceName: string | null;
};

export async function findNotionConnectionPublic(userId: string) {
  return NotionConnection.findOne({
    user: new Types.ObjectId(userId),
  }).exec();
}

export async function findNotionTokens(userId: string): Promise<StoredNotionTokens | null> {
  const row = await NotionConnection.findOne({
    user: new Types.ObjectId(userId),
  })
    .select("+accessTokenEncrypted +refreshTokenEncrypted")
    .exec();

  if (!row) {
    return null;
  }

  return {
    accessToken: decryptSecret(row.accessTokenEncrypted),
    refreshToken: decryptSecret(row.refreshTokenEncrypted),
    botId: row.botId,
    workspaceId: row.workspaceId,
    workspaceName: row.workspaceName ?? null,
  };
}

export async function upsertNotionConnection(
  userId: string,
  tokens: NotionTokenSet,
) {
  return NotionConnection.findOneAndUpdate(
    { user: new Types.ObjectId(userId) },
    {
      $set: {
        accessTokenEncrypted: encryptSecret(tokens.accessToken),
        refreshTokenEncrypted: encryptSecret(tokens.refreshToken),
        botId: tokens.botId,
        workspaceId: tokens.workspaceId,
        workspaceName: tokens.workspaceName,
        connectedAt: new Date(),
      },
      $setOnInsert: {
        user: new Types.ObjectId(userId),
      },
    },
    { new: true, upsert: true },
  ).exec();
}

export async function deleteNotionConnection(userId: string) {
  await NotionConnection.deleteOne({ user: new Types.ObjectId(userId) }).exec();
}
