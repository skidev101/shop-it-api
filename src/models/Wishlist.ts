import { Document, Schema, Types, model } from "mongoose";

export interface IWishlist extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  products: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: {
      type: [Schema.Types.ObjectId],
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);

export const Wishlist = model<IWishlist>("Wishlist", WishlistSchema);
