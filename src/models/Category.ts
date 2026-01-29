import { Document, model, Schema, Types } from "mongoose";


export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    trim: true,
    required: true
  },
  slug: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  }
});

export const Category = model<ICategory>("Category", CategorySchema)