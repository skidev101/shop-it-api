import { Document, model, Schema, Types } from "mongoose";



export interface IPayment extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  status: "pending" | "completed" | "failed" | "refunded";
  metadata?: {}
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: { 
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"]
  },
  metadata: {
    type: String
  }
}, { timestamps: true })


export const Payment = model<IPayment>("Payment", PaymentSchema)