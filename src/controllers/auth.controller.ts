import { Request, Response } from "express";
import authService from "../services/auth.service";
import { asyncHandler } from "../middlewares/errorHandler";
import { AuthRequest } from "../middlewares/auth";


export const sendEmailVerification = asyncHandler(async (req: Request, res: Response) => {
  const response = await authService.sendVerificationEmail(req.body.email);

  return res.status(200).json(response);
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const response = await authService.verifyOtp(req.body.email, req.body.otp);

  return res.status(200).json(response);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const response = await authService.register({ ...req.body });

  return res.status(201).json(response);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const response = await authService.login({ ...req.body }, req.headers["user-agent"], req.ip);

  return res.status(200).json(response);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const response = await authService.refreshToken(refreshToken, req.headers["user-agent"], req.ip);

  return res.status(200).json(response);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const response = await authService.logout(refreshToken);

  return res.status(200).json(response);
});


export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const response = await authService.forgotPassword(req.body.email);

  return res.status(200).json(response);
});

export const verifyPasswordResetOtp = asyncHandler(async (req: Request, res: Response) => {
  const response = await authService.verifyPasswordResetOtp(
    req.body.email,
    req.body.otp
  );

  return res.status(200).json(response);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const response = await authService.resetPassword(
    req.body.email,
    req.body.password
  );

  return res.status(200).json(response);
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const response = await authService.changePassword(
    userId,
    req.body.newPassword,
    req.body.currentPassword
  );

  return res.status(200).json(response);
});

export const updateProfile = async (req: Request, res: Response) => {
  const response = await authService.updateProfile();

  return res.status(200).json(response);
};
