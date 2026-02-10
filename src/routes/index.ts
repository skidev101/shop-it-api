import { Router } from "express";
import authRoutes from "./auth"


const router = Router()

router.get("/", (_req, res) => {
  res.json({
    message: "shop-it API",
    version: "1.0"
  })
});

router.get("/health", (_req, res) => {
  res.json({
    message: "shop-it API is live",
    version: "1.0"
  })
});

router.use("/auth", authRoutes);
router.use("/product", authRoutes);

export default router;