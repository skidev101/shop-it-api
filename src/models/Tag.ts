import { Schema, model, Document } from "mongoose";

export interface ITag extends Document {
  name: string;
  slug: string;
  usageCount: number;
}

const TagSchema = new Schema<ITag>({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  slug: { type: String, unique: true },
  usageCount: { type: Number, default: 0 },
});

export const Tag = model<ITag>("Tag", TagSchema);
