import { Document, model, Schema, Types } from "mongoose";
import bcrypt from "bcrypt"

export interface IUser extends Document {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
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
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (password: string ) => Promise<boolean>;
}

const AddressSchema = new Schema({
  street: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

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
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["customer", "admin", "vendor"],
        message: "{VALUE} is not a valid role",
      },
      default: "customer",
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    timezone: {
      type: String,
      trim: true,
      default: "Africa/Lagos",
    },
    addresses: [AddressSchema],
    isSuspended: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: any) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret: any) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function(password: string): Promise<Boolean> {
  return bcrypt.compare(password, this.password)
}

export const User = model<IUser>("User", UserSchema);
