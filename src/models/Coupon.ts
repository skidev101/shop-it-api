import { Document, Schema, Types, model } from "mongoose";




export interface ICoupon extends Document {
  _id: Types.ObjectId,
  code: string,
  description: string,
  discountType: "percentage" | "fixed",
  discountValue: number,
  minPurchaseAmount?: number,
  maxDiscountAmount?: number,
  usageLimit?: number,
  usedCount: number,
  validFrom: Date,
  validUntil: Date,
  isActive: boolean
}

const CouponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    default: "percentage"
  },
  discountValue: {
    type: Number,
    required: true
  },
  minPurchaseAmount: {
    type: Number
  },
  maxDiscountAmount: {
    type: Number
  },
  usageLimit: {
    type: Number
  },
  usedCount: {
    type: Number
  },
  validFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
})


export const Coupon = model<ICoupon>("Coupon", CouponSchema)