import dotenv from "dotenv";
dotenv.config({ quiet: true });

import express, { NextFunction, Request, Response, Express } from "express";
import { env } from "./src/config/env";
import router from "./src/routes";
import cookieParser from "cookie-parser";
import { ReqErrorHandler } from "./src/middlewares/error.middleware";
import { logger } from "./lib/logger";
import { requestLogger } from "./src/middlewares/requestLogger.middleware";

const app: Express = express();
const PORT = env.PORT;
const API_VERSION = env.API_VERSION;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(requestLogger);

app.use(`/api/${API_VERSION}/`, router);

app.use(ReqErrorHandler);

app.listen(PORT, () => {
  const env_label = env.IS_PROD ? "PRODUCTION" : "DEVELOPMENT";
  logger.info(`[${env_label}]: Server listening on ${PORT}`)
  // console.log(`API running on port ${PORT}`);
});
