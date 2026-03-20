import { Schema, model, Types, Document } from "mongoose";

export interface IOrder extends Document {
  userId: Types.ObjectId;
  idempotencyKey: string;

  status: "pending_payment" | "paid" | "shipped" | "delivered" | "cancelled";

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
  paidAt: Date;
  expiresAt: Date;
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
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ["pending_payment", "paid", "shipped", "delivered", "cancelled"],
    default: "pending_payment",
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
  },
  paidAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

export const Order = model<IOrder>("Order", OrderSchema);