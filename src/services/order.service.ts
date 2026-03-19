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
        .populate<{ productId: IProduct }>("productId")
        .session(session);
      if (!cartItems.length) throw new ValidationError("Cart is empty");

      const productIds = cartItems.map((i) => i.productId);

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
            shippingAddress,
            status: "pending",
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
      return parentOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

const orderService = new OrderService();
export default orderService;
