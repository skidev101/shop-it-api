import { Router } from "express";
import {
  login,
  register,
  sendEmailVerification,
  verifyOtp,
  refreshToken,
  logout,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  changePassword,
} from "../controllers/auth.controller";

const router: Router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/send-verification-email", sendEmailVerification);
router.post("/verify-otp", verifyOtp);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-password-reset-otp", verifyPasswordResetOtp);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);

export default router;
