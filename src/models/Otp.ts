import { Document, Schema, model } from "mongoose";


export interface IOtp extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  verified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })


export const Otp = model<IOtp>("Otp", OtpSchema)