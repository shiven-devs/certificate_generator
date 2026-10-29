import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const profileFields = {
  profileHandle: { type: String, unique: true, sparse: true },
  profileShowHeatmap: { type: Boolean, required: true, default: true },
  profileHeadline: { type: String, default: null, maxlength: 120 },
};

const activityStreakFields = {
  currentStreak: { type: Number, required: true, default: 0, min: 0 },
  longestStreak: { type: Number, required: true, default: 0, min: 0 },
  lastCheckInDate: { type: String, default: null },
  lastCheckInAt: { type: Date, default: null },
  activityTimeZone: { type: String, default: null },
};

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
    ...activityStreakFields,
    ...profileFields,
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false },
);

const existingUserModel = models.User as Model<InferSchemaType<typeof userSchema>> | undefined;
if (existingUserModel && !existingUserModel.schema.path("currentStreak")) {
  existingUserModel.schema.add(activityStreakFields);
}
if (existingUserModel && !existingUserModel.schema.path("profileShowHeatmap")) {
  existingUserModel.schema.add(profileFields);
}

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: { toString(): string };
};

export const User: Model<UserDocument> =
  (models.User as Model<UserDocument> | undefined) ??
  model<UserDocument>("User", userSchema);
