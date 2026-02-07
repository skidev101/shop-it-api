import dotenv from "dotenv"
dotenv.config({ quiet: true });


const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PROD = NODE_ENV === "production";

export const env = {
  NODE_ENV,
  IS_PROD,
  PORT: process.env.PORT!,
  DATABASE_URI: process.env.DATABASE_URI!,
  API_VERSION: process.env.API_VERSION || "v1",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  SMTP_HOST: process.env.SMTP_HOST!,
  EMAIL_PORT: process.env.EMAIL_PORT!,
  EMAIL_USER: process.env.EMAIL_USER!,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD!
}