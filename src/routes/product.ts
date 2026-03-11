import { Router } from "express";
import { createProduct } from "../controllers/product.controller";
import { upload } from "../config/cloudinary";

const router: Router = Router();

router.post("/", upload.array("images", 5), createProduct);

export default router;
