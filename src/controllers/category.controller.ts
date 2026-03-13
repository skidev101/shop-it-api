import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/errorHandler.middleware";
import categoryService from "../services/category.service";

export const createCategory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    if (!userId) {
        return res.status(401).json({ message: "You do not have access."})
    }
    const result = await categoryService.createCategory(userId, req.body);

    return res.status(201).json(result);
  },
);

export const getAllCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await categoryService.getAllCategories();
    return res.status(200).json(result);
  },
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    if (!categoryId || typeof categoryId !== "string") {
      return res.status(400).json({ message: "Category ID is required" });
    }
    const result = await categoryService.updateCategory(categoryId, req.body);

    return res.status(200).json(result);
  },
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    if (!categoryId || typeof categoryId !== "string") {
      return res.status(400).json({ message: "Category ID is required" });
    }
    const result = await categoryService.deleteCategory(categoryId);

    return res.status(200).json(result);
  },
);
