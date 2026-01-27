import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api-errors";

export function ReqErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message });
  }

  res.status(500).json({ message: "Internal server error" });
}
