import { NextFunction, Response, Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../lib/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = req.headers["x-correlation-id"] || uuidv4();
  (req as any).correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);

  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const level = status >= 400 ? "warn" : "info";

    logger[level as "info" | "warn"](
      `[${correlationId}]: ${req.method} -- ${status} - (${duration}ms)`
    );
  });

  next();
};


export default { requestLogger }