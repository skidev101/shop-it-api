import { Document, Schema, Types, model } from "mongoose";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  category: string;
  images: string[];
  variants?: [
    {
      name: string; // "color", "size"
      options: string[]; // ["red", "blue"]
    }
  ];
  specifications: Record<string, string>;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    trim: true,
  },
  comparePrice: {
    type: Number,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  images: {
    type: [String],
    required: true,
  },
  variants: {
    type: [
      {
        name: String,
        options: [String],
      },
    ],
  },
  specifications: {
    type: Schema.Types.Mixed, // fix later
  },
  isActive: {
    type: Boolean,
    required: true,
  },
  isFeatured: {
    type: Boolean,
    required: true,
    default: false,
  },
  tags: {
    type: [String],
    required: true,
  },
}, { timestamps: true });

ProductSchema.index({ slug: 1 });

export const Product = model<IProduct>("Product", ProductSchema);
