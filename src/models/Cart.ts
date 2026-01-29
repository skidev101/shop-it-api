import { model, Schema, Types } from "mongoose";



export interface ICart extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: [{
    productId: Types.ObjectId,
    quantity: number,
    price: number
  }],
  subTotal: number,
  createdAt: Date,
  updatedAt: Date
}

const CartSchema = new Schema<ICart>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  subTotal: {
    type: Number,
    required: true
  }
}, { timestamps: true })

export const Cart = model<ICart>("Cart", CartSchema)