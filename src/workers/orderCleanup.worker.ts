import { Worker } from "bullmq";
import { logger } from "../lib/logger";
import { redisConnection } from "../config/redis";
import { orderCleanupProcessor } from "../processors/orderCleanup.processor";

export const setupOrderWorker = () => {
  const worker = new Worker("order-cleanup", orderCleanupProcessor, {
    connection: redisConnection as any,
    concurrency: 5,
  });

  worker.on("completed", (job) => {
    logger.info(
      `Order cleanup job completed for product ${job.data}`,
    );
  });

  worker.on("failed", (job, err) => {
    logger.error(
      `Order cleanup job failed for product ${job?.data}:`,
      err.message,
    );
  });
};
