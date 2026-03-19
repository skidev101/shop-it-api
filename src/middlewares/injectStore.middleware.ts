import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { Store } from "../models/Store";
import { NotFoundError, ForbiddenError } from "../utils/api-errors";
import { Types } from "mongoose";

export interface StoreRequest extends AuthRequest {
  userStore?: {
    storeId: Types.ObjectId;
  };
}

export const injectStore = async (
  req: StoreRequest,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.user || req.user.role !== "vendor") {
    return next();
  }

  const store = await Store.findOne({ ownerId: req.user.userId });
  if (!store) {
    throw new NotFoundError(
      "Vendor store not found. Please create a store first.",
    );
  }
  if (store.status === "suspended") {
    throw new ForbiddenError(
      "Your store is suspended. Please contact support.",
    );
  }

  req.userStore = {
    storeId: store._id,
  };
  next();
};
