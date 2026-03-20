import { Worker } from "bullmq";
import { logger } from "../lib/logger";
import { redisConnection } from "../config/redis";
import { imageCleanupProcessor } from "../processors/imageCleanup.processors";

export const setupImageWorker = () => {
  const worker = new Worker("image-cleanup", imageCleanupProcessor, {
    connection: redisConnection as any,
    concurrency: 5,
  });

  worker.on("completed", (job) => {
    logger.info(
      `Image cleanup job completed for product ${job.data.productId}`,
    );
  });

  worker.on("failed", (job, err) => {
    logger.error(
      `Image cleanup job failed for product ${job?.data.productId}:`,
      err.message,
    );
  });
};
