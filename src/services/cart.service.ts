import { ClientSession } from "mongoose";
import { Cart } from "../models/Cart";
import { CartItem } from "../models/CartItem";
import { Product } from "../models/Product";
import { Variant } from "../models/Variant";
import { NotFoundError, ValidationError } from "../utils/api-errors";
import { SuccessRes } from "../utils/responses";

export class CartService {
  async getOrCreateCart(userId: string) {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId });
    }

    return cart;
  }

  async getCart(userId: string) {
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

    const cart = await this.getOrCreateCart(userId);

    const product = await Product.findById(productId);
    if (!product) throw new NotFoundError("Product");

    let price = product.basePrice;

    if (variantId) {
      const variant = await Variant.findById(variantId);
      if (!variant) throw new NotFoundError("Variant");

      if (variant.stock < quantity) {
        throw new ValidationError("Insufficient stock");
      }

      price = variant.price ?? product.basePrice;
    }

    const existing = await CartItem.findOneAndUpdate(
      {
        cartId: cart._id,
        productId,
        variantId: variantId || null,
        storeId: product.storeId,
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
      storeId: product.storeId,
      quantity,
      priceAtAdd: price,
      currentPrice: price,
    });

    return item;
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
  };
}


const cartService = new CartService();
export default cartService;