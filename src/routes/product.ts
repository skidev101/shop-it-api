import { Router } from "express";
import { register } from "../controllers/auth.controller";

const router = Router();

router.post("/new", register);

export default router;
