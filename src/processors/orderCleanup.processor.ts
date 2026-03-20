import { Job } from "bullmq";
import { logger } from "../lib/logger";
import { Order, Product, VendorOrder } from "../models";
import mongoose from "mongoose";

export const orderCleanupProcessor = async (job: Job) => {
  const { orderId } = job.data;
  if (!orderId) return;

  const order = await Order.findById(orderId);
  if (!order || order.status !== "pending_payment") {
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const vendorOrders = await VendorOrder.find({
      parentOrderId: order._id,
    }).session(session);

    const restoreOps = vendorOrders.flatMap((vo) =>
      vo.items.map((item) => ({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { stock: item.quantity } },
        },
      })),
    );

    if (restoreOps.length > 0) {
      await Product.bulkWrite(restoreOps, { session });
    }

    order.status = "cancelled";
    await order.save({ session });

    await session.commitTransaction();

    logger.info(`Successfully released stock for expired order: ${orderId}`);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
