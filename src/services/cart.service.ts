import { Cart } from "../models/Cart";
import { CartItem } from "../models/CartItem";
import { Product } from "../models/Product";
import { Variant } from "../models/Variant";
import { NotFoundError, ValidationError } from "../utils/api-errors";
import { SuccessRes } from "../utils/responses";

export class CartService {
  static async getOrCreateCart(userId: string) {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId });
    }

    return cart;
  }

  static async getCart(userId: string) {
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

  static async addItem({
    userId,
    productId,
    variantId,
    quantity,
  }: {
    userId: string;
    productId: string;
    variantId?: string;
    quantity: number;
  }) {
    if (quantity <= 0) {
      throw new ValidationError("Quantity must be greater than 0");
    }

    const cart = await this.getOrCreateCart(userId);

    // Validate product
    const product = await Product.findById(productId);
    if (!product) throw new NotFoundError("Product");

    let price = product.price;

    // Validate variant (if provided)
    if (variantId) {
      const variant = await Variant.findById(variantId);
      if (!variant) throw new NotFoundError("Vari found");

      if (variant.stock < quantity) {
        throw new ValidationError("Insufficient stock");
      }

      price = variant.price ?? product.price;
    }

    const existing = await CartItem.findOneAndUpdate(
      {
        cartId: cart._id,
        productId,
        variantId: variantId || null,
      },
      {
        $inc: { quantity },
        $set: { currentPrice: price },
      },
      { new: true },
    );

    if (existing) return existing;

    const item = await CartItem.create({
      cartId: cart._id,
      productId,
      variantId: variantId || null,
      quantity,
      priceAtAdd: price,
      currentPrice: price,
    });

    return item;
  }

  static async updateItemQuantity({
    userId,
    itemId,
    quantity,
  }: {
    userId: string;
    itemId: string;
    quantity: number;
  }) {
    if (quantity < 1) {
      throw new ValidationError("Quantity must be at least 1");
    }

    const cart = await this.getOrCreateCart(userId);

    const item = await CartItem.findOne({
      _id: itemId,
      cartId: cart._id,
    });

    if (!item) throw new NotFoundError("Cart");

    item.quantity = quantity;
    await item.save();

    return item;
  }

  static async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const result = await CartItem.findOneAndDelete({
      _id: itemId,
      cartId: cart._id,
    });

    if (!result) throw new NotFoundError("Item");

    return { success: true };
  }

  static async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await CartItem.deleteMany({ cartId: cart._id });

    return { success: true };
  }

  static async calculateTotals(userId: string) {
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

  // static async mergeCart({
  //   userId,
  //   items,
  // }: {
  //   userId: string;
  //   items: {
  //     productId: string;
  //     variantId?: string;
  //     quantity: number;
  //   }[];
  // }) {
  //   for (const item of items) {
  //     await this.addItem({
  //       userId,
  //       productId: item.productId,
  //       variantId: item.variantId,
  //       quantity: item.quantity,
  //     });
  //   }

  //   return this.getCart(userId);
  // }
}
