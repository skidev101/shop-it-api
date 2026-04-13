import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler.middleware";
import storeService from "../services/store.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export const createStore = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const payload = req.body;

    const result = await storeService.createStore(userId, payload);

    return res.status(201).json(result);
  },
);
