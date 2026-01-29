import { Document, model, Schema } from "mongoose";

export interface ITokenBlacklist extends Document {
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

const TokenBlacklistSchema = new Schema<ITokenBlacklist>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

export const TokenBlacklist = model<ITokenBlacklist>(
  "TokenBlacklist",
  TokenBlacklistSchema
);
