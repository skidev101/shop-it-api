import { Document, model, Schema, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    timezone: {
      type: String,
      trim: true,
      default: "Africa/Lagos",
    },
  },
  { timestamps: true }
);


UserSchema.index({ email: 1 });

export const User = model<IUser>("User", UserSchema)