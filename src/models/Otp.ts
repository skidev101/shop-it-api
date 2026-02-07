import { Document, Schema, model } from "mongoose";


export interface IOtp extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  isVerified: boolean;
  use: "email_verification" | "password_reset",
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
  isVerified: {
    type: Boolean,
    default: false
  },
  use: {
    type: String,
    enum: ["email_verification", "password_reset"],
    default: "email_verification",
    required: true
  }
}, { timestamps: true })


export const Otp = model<IOtp>("Otp", OtpSchema)