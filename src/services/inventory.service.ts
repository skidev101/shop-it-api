import mongoose, { ClientSession } from "mongoose";
import { Product, Variant } from "../models";
import { ValidationError } from "../utils/api-errors";

class InventoryService {
  async reserveItems(items: any[], session: ClientSession) {
    for (const item of items) {
      const query: any = {
        _id: item.productId,
        stock: { $gte: item.quantity },
      };

      const update: any = {
        $inc: {
          stock: -item.quantity,
          reservedStock: item.quantity,
        },
      };

      const updated = await Product.updateOne(query, update, { session });

      if (updated.modifiedCount === 0) {
        throw new ValidationError(
          `Insufficient stock for product ${item.productId}`
        );
      }

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
          { session }
        );

        if (variantUpdate.modifiedCount === 0) {
          throw new ValidationError(
            `Insufficient variant stock ${item.variantId}`
          );
        }
      }
    }
  }

  async confirmReservation(items: any[], session: ClientSession) {
    for (const item of items) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { reservedStock: -item.quantity } },
        { session }
      );

      if (item.variantId) {
        await Variant.updateOne(
          { _id: item.variantId },
          { $inc: { reservedStock: -item.quantity } },
          { session }
        );
      }
    }
  }

  async releaseReservation(items: any[], session: ClientSession) {
    for (const item of items) {
      await Product.updateOne(
        { _id: item.productId },
        {
          $inc: {
            stock: item.quantity,
            reservedStock: -item.quantity,
          },
        },
        { session }
      );

      if (item.variantId) {
        await Variant.updateOne(
          { _id: item.variantId },
          {
            $inc: {
              stock: item.quantity,
              reservedStock: -item.quantity,
            },
          },
          { session }
        );
      }
    }
  }
}

export const inventoryService = new InventoryService();