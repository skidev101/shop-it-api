import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../lib/logger";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.DATABASE_URI);
    logger.info("Database connected");
  } catch (err) {
    logger.error(`Database connection failed ${err}`);
    process.exit(1);
  }
};

mongoose.connection.on("error", (err) => {
  console.error("Database error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("Database disconnected");
});
