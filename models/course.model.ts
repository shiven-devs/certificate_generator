import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const courseItemSchema = new Schema(
  {
    youtubeVideoId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    durationSeconds: { type: Number, required: true, min: 0 },
    order: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const courseSchema = new Schema(
  {
    youtubeId: { type: String, required: true, unique: true },
    sourceType: { type: String, required: true, enum: ["video", "playlist"] },
    title: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    items: { type: [courseItemSchema], required: true, default: [] },
    totalDurationSeconds: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false },
);

export type CourseDocument = InferSchemaType<typeof courseSchema> & {
  _id: Types.ObjectId;
};

export const Course: Model<CourseDocument> =
  (models.Course as Model<CourseDocument> | undefined) ??
  model<CourseDocument>("Course", courseSchema);
