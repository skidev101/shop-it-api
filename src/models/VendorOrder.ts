import { Schema, model, Types, Document } from "mongoose";

export interface IVendorOrder extends Document {
  parentOrderId: Types.ObjectId;
  storeId: Types.ObjectId;
  items: {
    productId: Types.ObjectId;
    variantId: Types.ObjectId;
    quantity: number;
    price: number;
  }[];
  subTotal: number;
  status: "processing" | "shipped" | "delivered" | "cancelled";
}

const VendorOrderSchema = new Schema<IVendorOrder>(
  {
    parentOrderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        variantId: { type: Schema.Types.ObjectId, ref: "Variant" },
        quantity: Number,
        price: Number,
      },
    ],
    subTotal: Number,
    status: {
      type: String,
      default: "processing",
    },
  },
  { timestamps: true },
);

export const VendorOrder = model<IVendorOrder>(
  "VendorOrder",
  VendorOrderSchema,
);
