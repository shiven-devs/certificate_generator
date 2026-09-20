import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const activityDaySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    checkIn: { type: Boolean, required: true, default: false },
    lessonCompletions: { type: Number, required: true, default: 0, min: 0 },
    count: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: false },
);

activityDaySchema.index({ user: 1, date: 1 }, { unique: true });

export type ActivityDayDocument = InferSchemaType<typeof activityDaySchema> & {
  _id: { toString(): string };
  user: Types.ObjectId;
};

export const ActivityDay: Model<ActivityDayDocument> =
  (models.ActivityDay as Model<ActivityDayDocument> | undefined) ??
  model<ActivityDayDocument>("ActivityDay", activityDaySchema);
