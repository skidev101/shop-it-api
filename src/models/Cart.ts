import { Schema, model, Types, Document } from "mongoose";

export interface ICart extends Document {
  userId: Types.ObjectId;
  couponId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CartSchema = new Schema<ICart>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
    unique: true // one cart per user
  },
  couponId: {
    type: Schema.Types.ObjectId,
    ref: "Coupon"
  }
}, { timestamps: true });

export const Cart = model<ICart>("Cart", CartSchema);