import { Router } from "express";
import {
  getProducts,
  getProductBySlug,
} from "../../controllers/product.controller";

const router: Router = Router();

router.get("/", getProducts);
router.get("/:slug", getProductBySlug);

export default router;
