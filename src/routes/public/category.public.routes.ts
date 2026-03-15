import { Router } from "express";
import { getAllCategories } from "../../controllers/category.controller";

export const router: Router = Router();

router.get("/", getAllCategories);

export default router;
