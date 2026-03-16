import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const imageCleanupQueue = new Queue("image-cleanup", {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: 1000
  },
});
