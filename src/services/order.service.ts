import mongoose from "mongoose";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/api-errors";
import idempotencyService from "../utils/idempotency";
import cartService from "./cart.service";
import { Order, OrderItem, Product, Variant } from "../models";
import inventoryService from "./inventory.service";

// hello world
class OrderService {
  async createOrder(userId: string, idempotencyKey: string, payload: any) {
    const session = await mongoose.startSession();
    const { shippingAddress } = payload;

    const existingOrder = await Order.findOne({ idempotencyKey });
    if (existingOrder) return existingOrder;

    const started = await idempotencyService.startISession(idempotencyKey);
    if (!started) {
      const existing = await Order.findOne({ idempotencyKey });
      if (existing) return existing;

      const cached = await idempotencyService.getISession(idempotencyKey);
      if (cached?.status === "completed") {
        const order = await Order.findById(cached.orderId);
        return order;
      }

      throw new ConflictError("Request already in progress");
    }

    let response: any;

    try {
      await session.withTransaction(async () => {
        const { data } = await cartService.getCartItems(userId);
        const items = data.items;
        console.log("cart items:", items);

        if (!items.length) {
          throw new ValidationError("Cart is empty");
        }

        await inventoryService.reserveItems(items, session);

        const productIds = items.map((i: any) => i.productId);
        const variantIds = items
          .filter((i: any) => i.variantId)
          .map((i: any) => i.variantId);

        const [products, variants] = await Promise.all([
          Product.find({ _id: { $in: productIds } }).session(session),
          Variant.find({ _id: { $in: variantIds } }).session(session),
        ]);

        const productMap = new Map(products.map((p) => [p._id.toString(), p]));
        const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));

        console.log("Fetched products:", productMap);
        console.log("Fetched variants:", variantMap);

        let totalAmount = 0;
        const orderItemsPayload: any[] = [];

        for (const item of items) {
          console.log("begin search with productId:", productIds)
          const product = productMap.get(item.productId._id.toString());
          console.log("Found product:", product);
          if (!product) throw new NotFoundError("Product");

          let price = product.basePrice;
          let name = product.name;
          let image = product?.images?.[0]?.url;

          if (item.variantId) {
            const variant = variantMap.get(item.variantId);
            if (!variant) throw new NotFoundError("Variant");

            if (variant.productId.toString() !== item.productId) {
              throw new ValidationError("Invalid variant id for product");
            }

            if (variant.stock < item.quantity) {
              throw new ValidationError("Insufficient stock");
            }

            price = variant.price ?? product.basePrice;
            image = variant.image.url ?? product?.images?.[0]?.url;
          }

          const total = price * item.quantity;
          totalAmount += total; // final price

          orderItemsPayload.push({
            storeId: item.storeId,
            productId: product._id,
            variantId: item.variantId,
            quantity: item.quantity,
            name,
            image,
            price,
            total,
          });
        }

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const order = new Order({
          userId,
          idempotencyKey,
          totalAmount,
          discountAmount: 0,
          finalAmount: totalAmount,
          shippingAddress,
          expiresAt,
        });

        await order.save({ session });

        await OrderItem.insertMany(
          orderItemsPayload.map((i: any) => ({
            ...i,
            orderId: order._id,
          })),
          { session },
        );

        await cartService.clearCart(userId);

        response = order;
      });

      await idempotencyService.completeISession(idempotencyKey, response._id);

      return response;
    } catch (err) {
      await idempotencyService.cleanupISession(idempotencyKey);
      throw err;
    } finally {
      session.endSession();
    }
  }


  async getOrder(userId: string, orderId: string) {
    const order = await Order.findOne({ _id: orderId, userId }).populate("items");
    if (!order) throw new NotFoundError("Order");

    return order;
  }
}

const orderService = new OrderService();
export default orderService;
