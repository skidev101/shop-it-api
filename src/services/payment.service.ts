import axios from "axios";
import { env } from "../config/env";
import crypto from "crypto";
import { Order, User } from "../models";
import { logger } from "../lib/logger";
import { NotFoundError } from "../utils/api-errors";

class PaymentService {
  private readonly secretKey: string = env.PAYMENT_SECRET_KEY;

  async initializePayment(userId: string, orderId: string) {
    const order = await Order.findOne({ _id: orderId });
    if (!order) throw new NotFoundError("Order");

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User");

    const url = "https://api.paystack.co/transaction/initialize";

    const amountInKobo = Math.round(order.finalAmount * 100);

    const body = {
      email: user.email,
      amount: amountInKobo,
      reference: `order_${orderId}_${Date.now()}`,
      callback_url: `${env.FRONTEND_URL}/payment/callback`,
      metadata: {
        orderId: orderId,
        userId: userId,
      },
    };

    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
    });

    return response.data.data;
  }

  async processWebhook(payload: any, signature: string) {
    const hash = crypto
      .createHmac("sha512", this.secretKey)
      .update(JSON.stringify(payload))
      .digest("hex");

    if (hash !== signature) {
      throw new Error("Invalid Webhook Signature");
    }

    if (payload.event === "charge.success") {
      const orderId = payload.data.reference;
      const paystackAmount = payload.data.amount; // in kobo

      const order = await Order.findById(orderId);

      if (!order) return;
      logger.error(`order ${orderId} not found at payment service`);

      if (order.status === "paid") return;

      const expectedAmount = Math.round(order.finalAmount * 100);

      if (expectedAmount === paystackAmount) {
        order.status = "paid";
        order.paidAt = new Date();
        order.paymentId = payload.data.id;
        await order.save();

        // TIP: Trigger "Send Receipt" email here!
      }
    }
  }
}

const paymentService = new PaymentService();
export default paymentService;
