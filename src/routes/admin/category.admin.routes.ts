import { Router } from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../controllers/category.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../../validators/category.validators";


const router: Router = Router();


router.use(authenticate, authorize("admin"));

router.post("/new", validate(createCategorySchema), createCategory);
router.patch("/:categoryId", validate(updateCategorySchema), updateCategory);
router.delete("/:categoryId", deleteCategory);


export default router