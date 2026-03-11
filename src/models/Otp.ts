import { Document, Schema, model } from "mongoose";
import bcrypt from "bcrypt";

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


OtpSchema.index({ email: 1, use: 1 });
OtpSchema.pre("save", async function() {
  if (!this.isModified("otp")) return; 
  this.otp = await bcrypt.hash(this.otp, 12);
});

export const Otp = model<IOtp>("Otp", OtpSchema)