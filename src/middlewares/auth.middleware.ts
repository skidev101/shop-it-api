import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../utils/api-errors";
import { env } from "../config/env";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new UnauthorizedError("No token provided. Login to get access");
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET || "") as {
      userId: string;
      email: string;
      role: string;
      jti: string;
    };

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };
    next();
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired token");
  }
};
