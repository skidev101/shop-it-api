import { Document, Schema, Types, model } from "mongoose";

export interface IProduct extends Document {
  uploadedBy: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  stock: number;
  price: number;
  comparePrice?: number;
  category: string;
  images: string[];
  variants?: [
    {
      name: string; // "color", "size"
      options: string[]; // ["red", "blue"]
      stock: number;
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
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "UserId is required"]
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
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  stock: {
    type: Number,
    required: true
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
        stock: Number
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
    index: true
  },
  tags: {
    type: [String],
    required: true,
    index: true
  },
}, { timestamps: true });


export const Product = model<IProduct>("Product", ProductSchema);
