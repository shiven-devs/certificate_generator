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
    // Leave this field unset until a certificate is issued. A unique index
    // indexes an explicit null, so a default of null blocks every later enrollment.
    certificateVerifyToken: { type: String },
    certificateReview: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    certificateRequestedAt: { type: Date, default: null },
    certificateReviewedAt: { type: Date, default: null },
  },
  { timestamps: false },
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index(
  { certificateVerifyToken: 1 },
  { unique: true, sparse: true },
);
enrollmentSchema.index({ status: 1, certificateReview: 1 });

export type EnrollmentDocument = InferSchemaType<typeof enrollmentSchema> & {
  _id: { toString(): string };
  user: Types.ObjectId;
  course: Types.ObjectId;
};

export const Enrollment: Model<EnrollmentDocument> =
  (models.Enrollment as Model<EnrollmentDocument> | undefined) ??
  model<EnrollmentDocument>("Enrollment", enrollmentSchema);
