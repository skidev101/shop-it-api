import { Router } from "express";
import authRoutes from "./auth"


const router = Router()

router.get("/", (_req, res) => {
  res.json({
    message: "Auth API",
    version: "1.0"
  })
});

router.use("/auth", authRoutes);

export default router;