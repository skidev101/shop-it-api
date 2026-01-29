import { Document, model, Schema, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role: "customer" | "admin" | "vendor";
  phoneNumber?: string;
  isVerified: boolean;
  timezone: string;
  addresses?: {
    street: string;
    city: string;
    country: string;
    zipCode: string;
    isDefault: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema({
  street:{
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
})

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "admin", "vendor"],
      default: "customer"
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    timezone: {
      type: String,
      trim: true,
      default: "Africa/Lagos",
    },
    addresses: [AddressSchema]
  },
  { timestamps: true }
);


UserSchema.index({ email: 1 });

export const User = model<IUser>("User", UserSchema)