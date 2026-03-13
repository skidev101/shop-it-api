import { Router } from "express";
import { createProduct } from "../controllers/product.controller";
import { upload } from "../config/cloudinary";
import { authenticate } from "../middlewares/auth.middleware";
import { createProductSchema } from "../validators/product.validator";
import { validate } from "../middlewares/validate.middleware";
import { authorize } from "../middlewares/authorize.middleware";

const router: Router = Router();

router.post(
  "/new",
  authenticate,
  authorize("admin"),
  validate(createProductSchema),
  upload.array("images", 5),
  createProduct,
);

export default router;
