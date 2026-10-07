import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const itemProgressSchema = new Schema(
  {
    youtubeVideoId: { type: String, required: true },
    watchedSeconds: { type: Number, required: true, default: 0, min: 0 },
    completed: { type: Boolean, required: true, default: false },
    lastHeartbeatAt: { type: Date, default: null },
    lastHeartbeatVideoTime: { type: Number, default: null },
  },
  { _id: false },
);

const enrollmentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    itemProgress: { type: [itemProgressSchema], required: true, default: [] },
    status: {
      type: String,
      required: true,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
    completedAt: { type: Date, default: null },
    certificateUrl: { type: String, default: null },
    certificateVerifyToken: { type: String, default: null },
  },
  { timestamps: false },
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index(
  { certificateVerifyToken: 1 },
  { unique: true, sparse: true },
);

export type EnrollmentDocument = InferSchemaType<typeof enrollmentSchema> & {
  _id: { toString(): string };
  user: Types.ObjectId;
  course: Types.ObjectId;
};

export const Enrollment: Model<EnrollmentDocument> =
  (models.Enrollment as Model<EnrollmentDocument> | undefined) ??
  model<EnrollmentDocument>("Enrollment", enrollmentSchema);
