import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: false, select: false },
    googleId: { type: String, unique: true, sparse: true },
    currentSessionId: { type: String, default: null },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false },
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: { toString(): string };
};

export const User: Model<UserDocument> =
  (models.User as Model<UserDocument> | undefined) ??
  model<UserDocument>("User", userSchema);
