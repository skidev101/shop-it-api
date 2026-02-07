import { Document, Types, Schema, model } from "mongoose";
import bcrypt from "bcrypt";


export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  jti: string;
  tokenHash: string;
  userAgent?: string;
  ip?: string;
  isRevoked: boolean;
  compareToken: (token: string) => Promise<boolean>;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  jti: {
    type: String,
    required: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  ip: {
    type: String
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  }
}, {timestamps: true})


RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

RefreshTokenSchema.methods.compareToken = async function(token: string) {
  return bcrypt.compare(token, this.tokenHash);
}

export const RefreshToken = model<IRefreshToken>("RefreshToken", RefreshTokenSchema);