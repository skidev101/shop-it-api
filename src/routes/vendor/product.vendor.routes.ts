import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
} from "../../validators/product.validator";
import { validate } from "../../middlewares/validate.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import {
  createProduct,
  updateProduct,
  updateProductStatus,
} from "../../controllers/product.controller";

const router: Router = Router();

router.use(authenticate, authorize("vendor", "admin"));
router.post(
  "/new",
  validate(createProductSchema),
  createProduct,
);

router.patch(
  "/:productId/update",
  validate(updateProductSchema),
  updateProduct,
);

router.patch(
  "/:productId/status",
  validate(updateProductStatusSchema),
  updateProductStatus,
);

export default router;
