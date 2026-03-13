import { Router } from "express";
import { getAllCategories, updateCategory, deleteCategory, createCategory } from "../controllers/category.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createCategorySchema,updateCategorySchema } from "../validators/category.validators";
import { authorize } from "../middlewares/authorize.middleware";

const router: Router = Router();

router.get("/", getAllCategories);

// admin routes
router.use(authenticate, authorize("admin"));

router.post("/new", validate(createCategorySchema), createCategory);
router.patch("/:categoryId", validate(updateCategorySchema), updateCategory);
router.delete("/:categoryId", deleteCategory);

export default router;