import { Document, Schema, Types, model } from "mongoose";

export interface IProduct extends Document {
  storeId: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  comparePrice?: number | undefined;
  sku: string;
  stock: number;
  reservedStock: number;
  category: Types.ObjectId;
  images: Array<{ url: string; public_id: string; isMain: boolean }>;
  variants: Types.ObjectId[];
  specifications: Array<{ key: string; value: string }>;
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
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "StoreId is required"],
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
      unique: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
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
          url: { type: String, required: [true, "product image url is required"] },
          public_id: { type: String, required: [true, "cloudinary public id is required"] },
          isMain: { type: Boolean, default: false },
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
      type: [
        {
          key: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
      default: [],
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
