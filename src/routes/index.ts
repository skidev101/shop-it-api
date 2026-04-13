import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import publicProductRoutes from "./public/product.public.routes";
// import adminProductRoutes from "./admin/product.admin.routes";
import vendorProductRoutes from "./vendor/product.vendor.routes";
import publicCategoryRoutes from "./public/category.public.routes";
import adminCategoryRoutes from "./admin/category.admin.routes";
import customerOrderRoutes from "./customer/order.customer.routes";
import vendorStoreRoutes from "./vendor/vendor.store.routes";

const router: Router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "shop-it API",
    version: "1.0",
  });
});

router.get("/health", (_req: Request, res: Response) => {
  res.json({
    message: "shop-it API is live",
    version: "1.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// public routes
router.use("/auth", authRoutes);
router.use("/product", publicProductRoutes);
router.use("/category", publicCategoryRoutes);

// admin routes
// router.use("/admin/product", adminProductRoutes);
router.use("/admin/category", adminCategoryRoutes);

// customer routes
router.use("/customer/order", customerOrderRoutes);

// vendor routes
router.use("/vendor/product", vendorProductRoutes);
router.use("/vendor/store", vendorStoreRoutes);

export default router;
