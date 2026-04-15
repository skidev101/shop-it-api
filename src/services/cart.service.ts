import mongoose, { ClientSession } from "mongoose";
import { Cart, ICart } from "../models/Cart";
import { CartItem } from "../models/CartItem";
import { Product } from "../models/Product";
import { Variant } from "../models/Variant";
import { NotFoundError, ValidationError } from "../utils/api-errors";
import { SuccessRes } from "../utils/responses";

export class CartService {
  private async getOrCreateCart(
    userId: string,
    options: { session?: ClientSession } = {},
  ) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const cart = await Cart.findOneAndUpdate(
      { userId: userObjectId } as any,
      {
        $setOnInsert: { userId: userObjectId },
      },
      {
        new: true,
        upsert: true,
        session: options.session ?? null,
      },
    );

    return cart;
  }

  async getCartItems(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const items = await CartItem.find({ cartId: cart._id })
      .populate("productId")
      .populate("variantId");

    return SuccessRes({
      message: "Cart fetched",
      data: {
        cart,
        items,
      },
    });
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string,
  ) {
    if (quantity <= 0) {
      throw new ValidationError("Quantity must be greater than 0");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Get or create cart (within transaction)
      const cart = await this.getOrCreateCart(userId, { session });

      // 2. Fetch product
      const product = await Product.findById(productId).session(session);
      if (!product) throw new NotFoundError("Product");

      let price = product.basePrice;
      let stock: number;

      // 3. Handle variant logic
      let variant = null;
      if (variantId) {
        variant = await Variant.findById(variantId).session(session);
        if (!variant) throw new NotFoundError("Variant");

        // Ensure variant belongs to product
        if (variant.productId.toString() !== productId) {
          throw new ValidationError("Variant does not belong to product");
        }

        stock = variant.stock;
        price = variant.price ?? product.basePrice;
      } else {
        stock = product.stock;
      }

      // 4. Find existing cart item
      const query = {
        cartId: cart._id,
        productId,
        variantId: variantId || null,
        storeId: product.storeId,
      };

      const existingItem = await CartItem.findOne(query).session(session);

      const newQuantity = (existingItem?.quantity || 0) + quantity;

      // 5. Atomic stock enforcement (critical)
      if (stock < newQuantity) {
        throw new ValidationError("Insufficient stock");
      }

      // 6. Upsert cart item
      const item = await CartItem.findOneAndUpdate(
        query,
        {
          $inc: { quantity },
          $set: {
            currentPrice: price, // latest price always reflected
          },
          $setOnInsert: {
            priceAtAdd: price, // immutable initial price
            storeId: product.storeId,
          },
        },
        {
          new: true,
          upsert: true,
          session,
        },
      );

      // 7. OPTIONAL: Reserve stock (strong consistency model)
      // This prevents overselling across users
      if (variant) {
        const variantObjectId = new mongoose.Types.ObjectId(variantId);
        const updated = await Variant.updateOne(
          {
            _id: variantObjectId,
            stock: { $gte: quantity }, // atomic check
          },
          {
            $inc: { stock: -quantity },
          },
          { session },
        );

        if (updated.modifiedCount === 0) {
          throw new ValidationError("Insufficient stock (race condition)");
        }
      } else {
        const updated = await Product.updateOne(
          {
            _id: productId,
            stock: { $gte: quantity },
          },
          {
            $inc: { stock: -quantity },
          },
          { session },
        );

        if (updated.modifiedCount === 0) {
          throw new ValidationError("Insufficient stock (race condition)");
        }
      }

      await session.commitTransaction();
      return item;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ) {
    if (quantity < 1) {
      throw new ValidationError("Quantity must be at least 1");
    }

    const cart = await this.getOrCreateCart(userId);

    const item = await CartItem.findOneAndUpdate(
      {
        productId,
        cartId: cart._id,
      },
      { quantity },
      { new: true },
    );

    if (!item) throw new NotFoundError("Cart");

    return SuccessRes({
      message: "Cart item updated",
      data: { item },
    });
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getOrCreateCart(userId);

    const result = await CartItem.findOneAndDelete({
      productId,
      cartId: cart._id,
    });

    if (!result) throw new NotFoundError("Item");

    return SuccessRes({ message: "Item deleted" });
  }

  async clearCart(userId: string, session?: ClientSession) {
    const cart = await this.getOrCreateCart(userId);

    await CartItem.deleteMany({ cartId: cart._id }).session(session || null);

    return { success: true };
  }

  async calculateTotals(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const items = await CartItem.find({ cartId: cart._id });

    let subtotal = 0;

    for (const item of items) {
      subtotal += item.currentPrice * item.quantity;
    }

    return {
      subtotal,
      itemsCount: items.length,
    };
  }

  async mergeCart(userId: string, guestItems: any[]) {
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = await Cart.create({ userId });

    for (const item of guestItems) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const existingItem = await CartItem.findOne({
        cartId: cart._id,
        productId: item.productId,
        variantId: item.variantId,
      });

      if (existingItem) {
        existingItem.quantity += item.quantity;
        await existingItem.save();
      } else {
        await CartItem.create({
          cartId: cart._id,
          productId: item.productId,
          variantId: item.variantId,
          storeId: product.storeId,
          quantity: item.quantity,
          priceAtAdd: product.basePrice,
        });
      }
    }
    return cart;
  }
}

const cartService = new CartService();
export default cartService;
