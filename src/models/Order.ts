import { Schema, model, Types, Document } from "mongoose";

export interface IOrder extends Document {
  userId: Types.ObjectId;

  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";

  totalAmount: number;
  discountAmount: number;
  finalAmount: number;

  paymentId?: Types.ObjectId;

  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
    default: "pending",
    index: true
  },
  totalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },

  paymentId: {
    type: Schema.Types.ObjectId,
    ref: "Payment"
  },

  shippingAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  }
}, { timestamps: true });

export const Order = model<IOrder>("Order", OrderSchema);