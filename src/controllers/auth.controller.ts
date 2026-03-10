import { Request, Response } from "express";
import authService from "../services/auth.service";
import { asyncHandler } from "../middlewares/errorHandler.middleware";
import { AuthRequest } from "../middlewares/auth.middleware";
import { env } from "../config/env";

const COOKIEOPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite:
    env.NODE_ENV === "production" ? ("strict" as const) : ("lax" as const),
  path: "/",
};

export const sendEmailVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.sendVerificationEmail(req.body.email);

    return res.status(200).json(result);
  },
);

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.verifyOtp(req.body.email, req.body.otp);

  return res.status(200).json(result);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register({ ...req.body });

  res.cookie("accessToken", result.data.accessToken, {
    ...COOKIEOPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", result.data.refreshToken, {
    ...COOKIEOPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(201).json({
    message: "Registration successful",
    data: {
      user: result.data.user,
    },
    statusCode: 201,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const userAgent = req.headers["user-agent"] ?? "unknown";
  const ip = req.ip ?? "unknown";

  const result = await authService.login({ ...req.body }, { userAgent, ip });

  res.cookie("accessToken", result.data.accessToken, {
    ...COOKIEOPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", result.data.refreshToken, {
    ...COOKIEOPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(201).json({
    message: "Login successful",
    data: {
      user: result.data.user,
    },
    statusCode: 200,
  });
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token provided" });
    }

    const result = await authService.refreshToken(
      refreshToken,
      req.headers["user-agent"],
      req.ip,
    );

    res.cookie("accessToken", result.data.accessToken, {
      ...COOKIEOPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", result.data.refreshToken, {
      ...COOKIEOPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
    });
  },
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  await authService.logout(refreshToken);

  res.clearCookie("accessToken", COOKIEOPTIONS);
  res.clearCookie("refreshToken", COOKIEOPTIONS);

  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);

    return res.status(200).json(result);
  },
);

export const verifyPasswordResetOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.verifyPasswordResetOtp(
      req.body.email,
      req.body.otp,
    );

    return res.status(200).json(result);
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"] ?? "unknown";
    const ip = req.ip ?? "unknown";

    const result = await authService.resetPassword(email, password, {
      userAgent,
      ip,
    });

    res.cookie("accessToken", result.data.accessToken, {
      ...COOKIEOPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", result.data.refreshToken, {
      ...COOKIEOPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      data: { user: result.data.user },
      message: "Password reset successful. You are now logged in.",
    });
  },
);

export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await authService.changePassword(
      userId,
      req.body.newPassword,
      req.body.currentPassword,
    );

    return res.status(200).json(result);
  },
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.updateProfile();

    return res.status(200).json(result);
  },
);
