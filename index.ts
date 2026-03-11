import dotenv from "dotenv";
dotenv.config({ quiet: true });

import express, { NextFunction, Request, Response, Express } from "express";
import { env } from "./src/config/env";
import cors from "cors";
import router from "./src/routes";
import cookieParser from "cookie-parser";
import { requestLogger } from "./src/middlewares/requestLogger.middleware";
import { logger } from "./src/lib/logger";
import {
  errorHandler,
  notFoundHandler,
} from "./src/middlewares/errorHandler.middleware";
import { connectDB } from "./src/config/db";
import helmet from "helmet"; 
import morgan from "morgan";
import compression from "compression";
import { setupSwagger } from "./src/config/swagger";

const app: Express = express();
const PORT = env.PORT;
const API_VERSION = env.API_VERSION;

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

if (!env.IS_PROD) {
  app.use(morgan("dev"));
}

app.use(compression());

app.set("trust proxy", 1); // Trust first proxy for secure cookies behind proxies/load balancers

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


setupSwagger(app);

app.use(`/api/${API_VERSION}/`, router);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      const envLabel = env.IS_PROD ? "PRODUCTION" : "DEVELOPMENT";
      logger.info(`[${envLabel}] Server running on port ${PORT}`);
    });

  } catch (error) {
    logger.error("Server failed to start", error);
    process.exit(1);
  }
}

startServer();