import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler.middleware";
import paymentService from "../services/payment.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export const initializePayment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    console.log("userId in payment controller:", userId);
    const orderId = req.params.orderId as string;

    const result = await paymentService.initializePayment(userId, orderId);
    console.log("payment initialized:", result);

    return res.status(200).json(result);
  },
);

export const handleWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const signature = req.headers["x-paystack-signature"] as string;

    const result = await paymentService.processWebhook(req.rawBody, signature);
    console.log("result from webhook controller:", result);

    return res.status(200).send("Webhook processed");
  },
);
