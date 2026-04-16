import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler.middleware";
import paymentService from "../services/payment.service";

export const hendleWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const signature = req.headers["x-paystack-signature"] as string;

    const result = await paymentService.processWebhook(req.body, signature);
    console.log("result from webhook controller:", result);

    return res.status(200).send("Webhook processed");
  },
);
