import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const notionConnectionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    accessTokenEncrypted: { type: String, required: true, select: false },
    refreshTokenEncrypted: { type: String, required: true, select: false },
    botId: { type: String, required: true },
    workspaceId: { type: String, required: true },
    workspaceName: { type: String, default: null },
    connectedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false },
);

export type NotionConnectionDocument = InferSchemaType<
  typeof notionConnectionSchema
> & {
  _id: { toString(): string };
  user: Types.ObjectId;
};

export const NotionConnection: Model<NotionConnectionDocument> =
  (models.NotionConnection as Model<NotionConnectionDocument> | undefined) ??
  model<NotionConnectionDocument>("NotionConnection", notionConnectionSchema);
