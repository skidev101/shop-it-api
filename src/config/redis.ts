import IORedis from "ioredis";
import { env } from "./env"


export const redisConnection = new IORedis({
  host: env.REDIS_HOST || "127.0.0.1",
  port: parseInt(env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
});