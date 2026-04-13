import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import {
  getAllCartItems,
  addToCart,
  updateItemQuantity,
  deleteItem,
} from "../../controllers/cart.controller";

const router: Router = Router();

router.use(authenticate, authorize("customer", "admin"));

router.get("/", getAllCartItems);
router.post("/add", addToCart);
router.put("/update", updateItemQuantity);
router.delete("/delete", deleteItem);

export default router;
