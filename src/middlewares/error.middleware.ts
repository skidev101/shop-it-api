import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api-errors";
import { logger } from "../../lib/logger";

export function ReqErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    logger.error("Unhandled error", err);
    res.status(err.statusCode).json({ message: err.message });
  }
  
  logger.error("Unhandled error", err);
  res.status(500).json({ message: "Internal server error" });
}
