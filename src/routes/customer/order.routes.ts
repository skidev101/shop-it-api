import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import {
  createOrder,
} from "../../controllers/order.controller";

const router: Router = Router();

router.use(authenticate, authorize("customer"));
router.post("/new", createOrder);

export default router;
