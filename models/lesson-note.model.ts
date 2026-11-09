import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const notePageSchema = new Schema(
  {
    id: { type: String, required: true },
    body: { type: String, required: true, default: "", maxlength: 50_000 },
    notionPageId: { type: String, default: null },
    lastSyncedAt: { type: Date, default: null },
    lastSyncedHash: { type: String, default: null },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const lessonNoteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    youtubeVideoId: { type: String, required: true },
    pages: { type: [notePageSchema], default: [] },
    // Pre-pages notes kept a single body here. `ensureLessonNotePages` moves it
    // into `pages[0]` on first read and leaves these fields empty afterwards.
    body: { type: String, required: true, default: "", maxlength: 50_000 },
    notionPageId: { type: String, default: null },
    lastSyncedAt: { type: Date, default: null },
    lastSyncedHash: { type: String, default: null },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false },
);

lessonNoteSchema.index({ user: 1, course: 1, youtubeVideoId: 1 }, { unique: true });

export type LessonNoteDocument = InferSchemaType<typeof lessonNoteSchema> & {
  _id: { toString(): string };
  user: Types.ObjectId;
  course: Types.ObjectId;
};

export const LessonNote: Model<LessonNoteDocument> =
  (models.LessonNote as Model<LessonNoteDocument> | undefined) ??
  model<LessonNoteDocument>("LessonNote", lessonNoteSchema);
