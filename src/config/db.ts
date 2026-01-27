import mongoose from "mongoose";
import { env } from "./env";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.DATABASE_URI);
    console.log("Database connected");
  } catch (err) {
    console.log("Database connection error:", err);
    process.exit(1);
  }
};

mongoose.connection.on("error", (err) => {
  console.error("Database error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("Database disconnected");
});

export default { connectDB };
