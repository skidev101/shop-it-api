import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler.middleware";
import orderService from "../services/order.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export const createOrder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const idempotencyKey = req.headers["x-idempotency-key"] as string;
    if (!idempotencyKey) {
      return res
        .status(400)
        .json({ message: "Idempotency-Key header is required" });
    }

    const payload = req.body;

    const result = await orderService.createOrder(userId, idempotencyKey, payload);

    return res.status(201).json(result);
  },
);
