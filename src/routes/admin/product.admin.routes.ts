import { Router } from "express";
import { upload } from "../../config/cloudinary";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  createProductSchema,
  updateProductStatusSchema,
} from "../../validators/product.validator";
import { validate } from "../../middlewares/validate.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import {
  createProduct,
  updateProductStatus,
} from "../../controllers/product.controller";

const router: Router = Router();

router.use(authenticate, authorize("admin"));
router.post(
  "/new",
  upload.array("images", 5),
  validate(createProductSchema),
  createProduct,
);

router.patch(
  "/:productId/status",
  validate(updateProductStatusSchema),
  updateProductStatus,
);

export default router;
