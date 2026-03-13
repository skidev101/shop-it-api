import { Router, Request, Response } from "express";
import authRoutes from "./auth"
import productRoutes from "./product"
const router: Router = Router()



router.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "shop-it API",
    version: "1.0"
  })
});

router.get("/health", (_req: Request, res: Response) => {
  res.json({
    message: "shop-it API is live",
    version: "1.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
});

router.use("/auth", authRoutes);
router.use("/product", productRoutes);

export default router;