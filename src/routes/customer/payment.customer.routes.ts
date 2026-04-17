import { Router } from "express";
import {
  initializePayment,
  handleWebhook,
} from "../../controllers/payment.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

const router: Router = Router();

router.post("/webhook", handleWebhook);
router.use(authenticate, authorize("customer", "admin"));

router.post("/initialize/:orderId", initializePayment);


export default router;
