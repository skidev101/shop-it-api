import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  createStoreSchema,
} from "../../validators/store.validators";
import { validate } from "../../middlewares/validate.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import {
  createStore,
} from "../../controllers/store.controller";

const router: Router = Router();

router.use(authenticate, authorize("vendor", "admin"));
router.post(
  "/new",
  validate(createStoreSchema),
  createStore,
);

export default router;
