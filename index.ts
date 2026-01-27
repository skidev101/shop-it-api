import dotenv from "dotenv";
dotenv.config({ quiet: true });

import express, { NextFunction, Request, Response } from "express";
import { env } from "./src/config/env";
import router from "./src/routes";
import cookieParser from "cookie-parser";
import { ReqErrorHandler } from "./src/middlewares/error.middleware";

const app = express();
const PORT = env.PORT;
const API_VERSION = env.API_VERSION! || "v1";

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(`/api/${API_VERSION}/`, router);

app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({ error: "Endpoint not found" });
});
app.use(ReqErrorHandler);

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
