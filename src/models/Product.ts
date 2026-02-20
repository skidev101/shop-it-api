import { Document, Schema, Types, model } from "mongoose";

export interface IProductVariant {
  sku: string;
  attributes: Record<string, string>;
  price?: number;
  stock: number;
  image: string;
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
  images: string[];
  variants?: IProductVariant[];
  specifications: Record<string, string>;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IProductVariant>({
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  attributes: {
    type: Map,
    of: String,
    required: true,
  },
  price: {
    type: Number,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  image: String,
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
      type: [String],
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
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", description: "text", tags: "text" }, { weights: { name: 10, description: 2 }})

export const Product = model<IProduct>("Product", ProductSchema);
