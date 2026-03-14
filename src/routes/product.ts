import { Router } from "express";
import { createProduct, getProducts } from "../controllers/product.controller";
import { upload } from "../config/cloudinary";
import { authenticate } from "../middlewares/auth.middleware";
import { createProductSchema } from "../validators/product.validator";
import { validate } from "../middlewares/validate.middleware";
import { authorize } from "../middlewares/authorize.middleware";

const router: Router = Router();

router.get("/", getProducts)

router.post(
  "/new",
  authenticate,
  authorize("admin"),
  upload.array("images", 5),
  validate(createProductSchema),
  createProduct,
);

export default router;
