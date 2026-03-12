import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const imageCleanupQueue = new Queue("image-cleanup", {
  connection: redisConnection as any,
});
