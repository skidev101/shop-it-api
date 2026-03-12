import { Document, Schema, Types, model } from "mongoose";

export interface IProductVariant {
  sku: string;
  attributes: Array<{ name: string; value: string }>;
  price?: number;
  stock: number;
  images: Array<{ url: string; public_id: string }>;
  isActive?: boolean;
}

export interface IProduct extends Document {
  uploadedBy: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  comparePrice?: number;
  category: Types.ObjectId;
  images: Array<{ url: string; public_id: string }>;
  variants?: IProductVariant[];
  specifications: Record<string, string>;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const variantSchema = new Schema<IProductVariant>({
  sku: {
    type: String,
    required: true,
  },
  attributes: [
    {
      name: { type: String, required: true },
      value: { type: String, required: true },
    },
  ],
  price: {
    type: Number,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  images: [
    {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
});

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
    variants: {
      type: [variantSchema],
      default: [],
    },
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
      required: true,
    },
    ratingAverage: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
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
ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ deletedAt: 1 });

export const Product = model<IProduct>("Product", ProductSchema);
