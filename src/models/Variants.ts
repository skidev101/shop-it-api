import { Document, Schema, Types, model } from "mongoose";

export interface IVariant extends Document {
  product: Types.ObjectId;
  sku: string;
  attributes: Array<{ name: string; value: string }>;
  price?: number;
  stock: number;
  images: Array<{ url: string; public_id: string }>;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
      index: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
      unique: true, // SKUs must be globally unique across all variants
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
      // If not set, consumers should fall back to product.basePrice
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: 0,
      default: 0,
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

export const Variant = model<IVariant>("Variant", VariantSchema);