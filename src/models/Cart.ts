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
      index: true,
      unique: true, // one cart per user
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
    },
  },
  { timestamps: true },
);

export const Cart: Model<ICart> = model<ICart>("Cart", CartSchema);
