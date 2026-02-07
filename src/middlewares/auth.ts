import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../utils/api-errors";
import { env } from "../config/env";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("No token provided");
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      userId: string;
      email: string;
      jti: string;
    };

    req.user = payload;
    next();
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired token");
  }
};
