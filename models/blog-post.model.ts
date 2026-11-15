import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const blogPostSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: "", trim: true, maxlength: 300 },
    content: { type: String, required: true, maxlength: 100_000 },
    coverImageUrl: { type: String, default: null },
    tags: { type: [String], default: [] },
    status: { type: String, required: true, enum: ["draft", "published"], default: "draft" },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true, trim: true, maxlength: 80 },
    publishedAt: { type: Date, default: null },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false },
);

blogPostSchema.index({ status: 1, publishedAt: -1 });

export type BlogPostDocument = InferSchemaType<typeof blogPostSchema> & {
  _id: Types.ObjectId;
  author: Types.ObjectId;
};

export const BlogPost: Model<BlogPostDocument> =
  (models.BlogPost as Model<BlogPostDocument> | undefined) ??
  model<BlogPostDocument>("BlogPost", blogPostSchema);
