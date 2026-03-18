import { Schema, model, Types, Document } from "mongoose";

export interface ICartItem extends Document {
  cartId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;

  quantity: number;

  priceAtAdd: number; // snapshot when added
  currentPrice: number; // optional (for UI updates)

  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  cartId: {
    type: Schema.Types.ObjectId,
    ref: "Cart",
    required: true,
    index: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  variantId: {
    type: Schema.Types.ObjectId,
    ref: "Variant"
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  priceAtAdd: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number
  }
}, { timestamps: true });

// Prevent duplicate product+variant in same cart
CartItemSchema.index(
  { cartId: 1, productId: 1, variantId: 1 },
  { unique: true }
);

export const CartItem = model<ICartItem>("CartItem", CartItemSchema);