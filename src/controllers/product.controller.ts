import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler.middleware";
import { AuthRequest } from "../middlewares/auth.middleware";
import productService from "../services/product.service";

export const createProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const files = req.files as Express.Multer.File[];

    const result = await productService.createProduct(req.body, userId, files);

    return res.status(201).json(result);
  },
);

export const getProducts = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const query = req.query;
    const result = await productService.getProducts(query);

    return res.status(201).json(result);
  },
);

export const softDeleteProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { productId } = req.params;
    if (typeof productId !== "string") {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const result = await productService.softDeleteProduct(productId, userId);

    return res.status(200).json(result);
  },
);

export const hardDeleteProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { productId } = req.params;
    if (typeof productId !== "string") {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const result = await productService.hardDeleteProduct(productId, userId);

    return res.status(200).json(result);
  },
);
