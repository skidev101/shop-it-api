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

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await productService.getProducts(query);

  return res.status(201).json(result);
});

export const getProductBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const slug = req.params.slug;
    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ message: "Product slug is required" });
    }
    const result = await productService.getProductBySlug(slug);

    return res.status(201).json(result);
  },
);

export const updateProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { productId } = req.params as { productId: string };
    const updates = req.body;

    const files = req.files as Express.Multer.File[];

    const result = await productService.updateProduct(
      userId,
      productId,
      updates,
      files,
    );

    return res.status(200).json(result);
  },
);

export const updateProductStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { productId } = req.params as { productId: string };
    const updates = req.body;

    const result = await productService.updateProductStatus(
      userId,
      productId,
      updates,
    );

    return res.status(200).json(result);
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
