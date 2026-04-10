import mongoose, { ClientSession } from "mongoose";
import { Product, Variant } from "../models";
import { ValidationError } from "../utils/api-errors";

class InventoryService {
  async reserveItems(items: any[], session: ClientSession) {
    for (const item of items) {
      if (item.variantId) {
        const variantUpdate = await Variant.updateOne(
          {
            _id: item.variantId,
            stock: { $gte: item.quantity },
          },
          {
            $inc: {
              stock: -item.quantity,
              reservedStock: item.quantity,
            },
          },
          { session },
        );

        if (variantUpdate.modifiedCount === 0) {
          throw new ValidationError(
            `Insufficient variant stock ${item.variantId}`,
          );
        }
      } else {
        const updated = await Product.updateOne(
          {
            _id: item.productId,
            stock: { $gte: item.quantity },
          },
          {
            $inc: {
              stock: -item.quantity,
              reservedStock: item.quantity,
            },
          },
          { session },
        );

        if (updated.modifiedCount === 0) {
          throw new ValidationError(
            `Insufficient stock for product ${item.productId}`,
          );
        }
      }
    }
  }

  async confirmReservation(items: any[], session: ClientSession) {
    for (const item of items) {
      if (item.variantId) {
        await Variant.updateOne(
          { _id: item.variantId },
          { $inc: { reservedStock: -item.quantity } },
          { session },
        );
      } else {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { reservedStock: -item.quantity } },
          { session },
        );
      }
    }
  }

  async releaseReservation(items: any[]) {
    for (const item of items) {
      if (item.variantId) {
        await Variant.updateOne(
          { _id: item.variantId },
          {
            $inc: {
              stock: item.quantity,
              reservedStock: -item.quantity,
            },
          },
        );
      } else {
        await Product.updateOne(
          { _id: item.productId },
          {
            $inc: {
              stock: item.quantity,
              reservedStock: -item.quantity,
            },
          },
        );
      }
    }
  }
}

const inventoryService = new InventoryService();
export default inventoryService;
