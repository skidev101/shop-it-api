import { Document, Types, Schema, model } from "mongoose";

export interface IReview extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  helpfulCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    isVerifiedPurchase: {
      type: Boolean,
      required: true,
    },
    helpfulCount: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const Review = model<IReview>("Review", ReviewSchema);
