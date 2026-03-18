import { Schema, model, Types, Document } from "mongoose";

export interface IOrderItem extends Document {
  orderId: Types.ObjectId;

  productId: Types.ObjectId;
  variantId?: Types.ObjectId;

  name: string; // snapshot
  image: string; // snapshot

  quantity: number;
  price: number; // final price per unit

  total: number; // quantity * price

  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product"
  },
  variantId: {
    type: Schema.Types.ObjectId,
    ref: "Variant"
  },

  name: { type: String, required: true },
  image: { type: String },

  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true }
}, { timestamps: true });

export const OrderItem = model<IOrderItem>("OrderItem", OrderItemSchema);