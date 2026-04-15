import { Schema, Model, model, Types } from "mongoose";

export interface ICart {
  userId: Types.ObjectId;
  couponId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
    },
  },
  { timestamps: true },
);
CartSchema.index({ userId: 1 }, { unique: true });

export const Cart = model<ICart>("Cart", CartSchema);
