import mongoose from "mongoose";
import {
  Order,
  Product,
  Cart,
  CartItem,
  Variant,
  VendorOrder,
  ICartItem,
  IProduct,
} from "../models";
import {
  InsufficientStockError,
  NotFoundError,
  ServerError,
  ValidationError,
} from "../utils/api-errors";
import { Queue } from "bullmq";
import { orderCleanupQueue } from "../queues/orderCleanup.queue";

class OrderService {
  constructor(private readonly queue: Queue) {}

  private async getCartId(userId: string) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw new NotFoundError("Cart");
    return cart._id;
  }

  private groupItemsByStore(items: any[]) {
    return items.reduce(
      (acc, item) => {
        const storeId = item.storeId.toString();
        if (!acc[storeId]) acc[storeId] = [];
        acc[storeId].push(item);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  }

  async createOrder(
    userId: string,
    shippingAddress: any,
    idempotencyKey: string,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingOrder = await Order.findOne({ idempotencyKey }).session(
        session,
      );
      if (existingOrder) return existingOrder;

      const cartId = await this.getCartId(userId);
      const cartItems = await CartItem.find({ cartId })
        .populate<{ productId: IProduct }>("productId")
        .session(session);
      if (!cartItems.length) throw new ValidationError("Cart is empty");

      const stockOps = [];
      let totalAmount = 0;

      for (const item of cartItems) {
        const product = item.productId;
        if (!product) throw new NotFoundError(`Product ${item.productId}`);
        if (product.stock < item.quantity) {
          throw new InsufficientStockError(
            item.productId.toString(),
            product.stock,
            item.quantity,
          );
        }

        totalAmount += product.basePrice * item.quantity;

        stockOps.push({
          updateOne: {
            filter: { _id: product._id, stock: { $gte: item.quantity } },
            update: { $inc: { stock: -item.quantity } },
          },
        });
      }

      const result = await Product.bulkWrite(stockOps, { session });
      if (result.modifiedCount !== stockOps.length) {
        throw new ValidationError("Stock sync failed. Item already purchased");
      }

      const createdOrders = await Order.create(
        [
          {
            userId,
            totalAmount,
            finalAmount: totalAmount,
            idempotencyKey,
            shippingAddress,
            status: "pending_payment",
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        ],
        { session },
      );
      const parentOrder = createdOrders[0];
      if (!parentOrder) {
        throw new ServerError("Failed to initialize order");
      }

      const itemsByStore: Record<string, ICartItem[]> =
        this.groupItemsByStore(cartItems);

      const vendorOrderData = Object.entries(itemsByStore).map(
        ([storeId, items]) => {
          const subTotal = items.reduce(
            (sum, item) => sum + item.priceAtAdd * item.quantity,
            0,
          );
          const platformFee = subTotal * 0.1;

          return {
            parentOrderId: parentOrder._id,
            storeId: new mongoose.Types.ObjectId(storeId),
            items: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId
                ? new mongoose.Types.ObjectId(item.variantId)
                : null,
              quantity: item.quantity,
              price: item.priceAtAdd,
            })),
            subTotal: subTotal,
            platformFee,
            vendorNet: subTotal - platformFee,
            status: "processing",
          };
        },
      );

      await VendorOrder.insertMany(vendorOrderData, { session });

      await CartItem.deleteMany({ cartId }).session(session);

      await session.commitTransaction();

      await this.queue.add(
        `cleanup-expired-order`,
        { orderId: parentOrder._id },
        { delay: 30 * 60 * 1000, jobId: `cleanup-${parentOrder._id}` },
      );

      return parentOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }


  async handlePaymentSuccess(orderId: string, paymentId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new NotFoundError("Order");

      if (order.status === "paid") {
        return order;
      }

      if (order.status !== "pending_payment") {
        throw new ValidationError("Order not in payable state")
      }

      order.status = "paid";
      order.paymentId = paymentId;
    }
  }
}

const orderService = new OrderService(orderCleanupQueue);
export default orderService;
