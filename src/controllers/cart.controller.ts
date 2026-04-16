import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/errorHandler.middleware";
import cartService from "../services/cart.service";

export const addToCart = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const productId = req.body.productId as string;
    const variantId = req.body.variantId as string | undefined;
    const quantity = req.body.quantity as number;

    const result = await cartService.addItem(
      userId,
      productId,
      quantity,
      variantId,
    );

    return res.status(201).json(result);
  },
);

export const getAllCartItems = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const result = await cartService.getCartItems(userId);
    return res.status(200).json(result);
  },
);

export const updateItemQuantity = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const productId = req.params.productId as string;
    const quantity = req.body.quantity as number;

    const result = await cartService.updateItemQuantity(
      userId,
      productId,
      quantity,
    );

    return res.status(200).json(result);
  },
);

export const deleteItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const productId = req.params.productId as string;

    const result = await cartService.removeItem(userId, productId);

    return res.status(200).json(result);
  },
);

export const deleteAllItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const productId = req.params.productId as string;

    const result = await cartService.clearCart(userId);

    return res.status(200).json(result);
  },
);


