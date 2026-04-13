import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.middleware";
import { ForbiddenError } from "../utils/api-errors";


export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError("You do not have permission to access this.");
    }
    next();
  };
};
