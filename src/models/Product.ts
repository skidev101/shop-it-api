import { Document, Schema, Types, model } from "mongoose";

export interface IProduct extends Document {
  uploadedBy: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  comparePrice?: number | undefined;
  sku: string;        // base/default SKU — variants carry their own
  stock: number;      // denormalized total; sum of all variant stocks
  category: Types.ObjectId;
  images: Array<{ url: string; public_id: string }>;
  variants: Types.ObjectId[];  // refs to Variant documents
  specifications: Record<string, string>;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "UserId is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    comparePrice: {
      type: Number,
      min: 0,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      // This is a denormalized field. It is NOT set by the client.
      // It is recalculated by the service whenever a variant's stock changes.
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          public_id: { type: String, required: true },
        },
      ],
      required: true,
    },
    variants: [
      {
        type: Schema.Types.ObjectId,
        ref: "Variant",
      },
    ],
    specifications: {
      type: Map,
      of: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    ratingAverage: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

ProductSchema.index(
  { name: "text", description: "text", tags: "text" },
  { weights: { name: 10, description: 2 } },
);

export const Product = model<IProduct>("Product", ProductSchema);