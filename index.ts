import dotenv from "dotenv";
dotenv.config({ quiet: true });

import express, { NextFunction, Request, Response, Express } from "express";
import { env } from "./src/config/env";
import router from "./src/routes";
import cookieParser from "cookie-parser";
import {requestLogger} from "./src/middlewares/requestLogger";
import { logger } from "./src/lib/logger";
import { errorHandler, notFoundHandler } from "./src/middlewares/errorHandler";
import { connectDB } from "./src/config/db";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from "./src/config/swagger";

const app: Express = express();
const PORT = env.PORT;
const API_VERSION = env.API_VERSION;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(requestLogger);

app.use(`/api/${API_VERSION}/`, router);

if (process.env.NODE_ENV !== "production") {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  connectDB()
    .then(() => {
      const env_label = env.IS_PROD ? "PRODUCTION" : "DEVELOPMENT";
      logger.info(`[${env_label}]: Server listening on ${PORT}`)

    })
    .catch((e) => {
      console.error("Database connection error:", e);
    })
});