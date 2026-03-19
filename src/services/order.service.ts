import mongoose from "mongoose";
import {
  Order,
  Product,
  Cart,
  CartItem,
  Variant,
  VendorOrder,
  ICartItem,
} from "../models";
import { ApiError, NotFoundError, ServerError, ValidationError } from "../utils/api-errors";

class OrderService {
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

  private async handleStockReduction(
    item: any,
    session: mongoose.ClientSession,
  ) {
    if (item.variantId) {
      const update = await Variant.findOneAndUpdate(
        { _id: item.variantId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session, new: true },
      );
      if (!update) throw new ValidationError("Insufficient variant stock");
    }

    const prodUpdate = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { session, new: true },
    );
    if (!prodUpdate) throw new ValidationError("Insufficient product stock");
  }

  async createOrder(userId: string, shippingAddress: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const cartId = await this.getCartId(userId);
      const cartItems = await CartItem.find({ cartId })
        .populate("productId", "name basePrice stock storeId")
        .session(session);

      if (!cartItems.length) throw new ValidationError("Cart is empty");

      for (const item of cartItems) {
        await this.handleStockReduction(item, session);
      }

      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.priceAtAdd * item.quantity,
        0,
      );

      const createdOrders = await Order.create(
        [
          {
            userId,
            totalAmount,
            finalAmount: totalAmount,
            shippingAddress,
            status: "pending",
          },
        ],
        { session },
      );
      const parentOrder = createdOrders[0];
      if (!parentOrder) {
        throw new ServerError("Failed to initialize order")
      }

      const itemsByStore: Record<string, ICartItem[]> =
        this.groupItemsByStore(cartItems);

      const vendorOrderPromises = Object.entries(itemsByStore).map(
        ([storeId, items]) => {
          const subTotal = items.reduce(
            (sum, item) => sum + item.priceAtAdd * item.quantity,
            0,
          );
          const platformFee = subTotal * 0.1;

          return VendorOrder.create(
            [
              {
                parentOrderId: parentOrder._id,
                storeId: new mongoose.Types.ObjectId(storeId),
                items: items.map((item) => ({
                  productId: item.productId,
                  variantId: item.variantId ? new mongoose.Types.ObjectId(item.variantId) : null,
                  quantity: item.quantity,
                  price: item.priceAtAdd,
                })),
                subTotal: subTotal,
                platformFee,
                vendorNet: subTotal - platformFee,
                status: "processing",
              },
            ],
            { session },
          );
        },
      );

      await Promise.all(vendorOrderPromises);

      await CartItem.deleteMany({ cartId }).session(
        session,
      );

      await session.commitTransaction();
      return parentOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
