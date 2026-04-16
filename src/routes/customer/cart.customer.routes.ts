import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import {
  getAllCartItems,
  addToCart,
  updateItemQuantity,
  deleteItem,
  clearCart,
} from "../../controllers/cart.controller";

const router: Router = Router();

router.use(authenticate, authorize("customer", "admin"));

router.get("/", getAllCartItems);
router.post("/add", addToCart);
router.put("/update/:productId", updateItemQuantity);
router.delete("/delete/:productId", deleteItem);
router.delete("/clear", clearCart);

export default router;
