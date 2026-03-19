import { Schema, model, Types, Document } from "mongoose";

export interface IStore extends Document {
  ownerId: Types.ObjectId;
  name: string;
  slug: string;
  logo: { url: string; public_id: string };
  description: string;
  status: "pending" | "active" | "suspended";
  balance: number;
  isVerified: boolean;
}

const StoreSchema = new Schema<IStore>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    logo: {
      url: {
        type: String,
        default: "",
      },
      public_id: {
        type: String,
        default: "",
      },
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
    },
    balance: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Store = model<IStore>("Store", StoreSchema);
