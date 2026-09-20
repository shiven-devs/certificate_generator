import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const activityDayFields = {
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },
  checkIn: { type: Boolean, required: true, default: false },
  watchedSeconds: { type: Number, required: true, default: 0, min: 0 },
  lessonCompletions: { type: Number, required: true, default: 0, min: 0 },
  count: { type: Number, required: true, default: 0, min: 0 },
};

const activityDaySchema = new Schema(activityDayFields, { timestamps: false });

activityDaySchema.index({ user: 1, date: 1 }, { unique: true });

const existingActivityDay = models.ActivityDay as
  | Model<InferSchemaType<typeof activityDaySchema>>
  | undefined;
if (existingActivityDay && !existingActivityDay.schema.path("watchedSeconds")) {
  existingActivityDay.schema.add({
    watchedSeconds: { type: Number, required: true, default: 0, min: 0 },
  });
}

export type ActivityDayDocument = InferSchemaType<typeof activityDaySchema> & {
  _id: { toString(): string };
  user: Types.ObjectId;
};

export const ActivityDay: Model<ActivityDayDocument> =
  (models.ActivityDay as Model<ActivityDayDocument> | undefined) ??
  model<ActivityDayDocument>("ActivityDay", activityDaySchema);
