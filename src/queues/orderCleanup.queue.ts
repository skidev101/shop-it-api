import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const orderCleanupQueue = new Queue("order-cleanup", {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: 1000
  },
});
