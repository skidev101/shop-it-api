import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler.middleware";
import productService, { ProductQuery } from "../services/product.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export const createProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    const payload = req.body;
    console.log("Received payload:", payload);
    const storeId = payload.storeId;
    console.log("storeId:", storeId);
    if (!storeId) {
      return res
        .status(400)
        .json({ message: "storeId is required in the request body." });
    }

    const result = await productService.createProduct(userId, storeId, payload);

    return res.status(201).json(result);
  },
);

export const getProducts = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const query = req.query;
    console.log("Received query:", query);

    const result = await productService.getProducts(query as ProductQuery);

    return res.status(200).json(result);
  },
);

export const getProductBySlug = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const slug = req.params.slug as string;
    const result = await productService.getProductBySlug(slug);

    return res.status(200).json(result);
  },
);

export const updateProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const productId = req.params.productId as string;
    const storeId = req.body.storeId;
    if (!storeId) {
      return res
        .status(400)
        .json({ message: "storeId is required in the request body." });
    }

    const payload = req.body;

    const result = await productService.updateProduct(
      userId,
      productId,
      storeId,
      payload,
    );

    return res.status(200).json(result);
  },
);

export const updateProductStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const productId = req.params.productId as string;
    const storeId = req.body.storeId;

    const payload = req.body;

    const result = await productService.updateProductStatus(
      userId,
      productId,
      storeId,
      payload,
    );

    return res.status(200).json(result);
  },
);
