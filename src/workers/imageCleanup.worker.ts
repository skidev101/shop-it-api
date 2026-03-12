import { Worker } from "bullmq";
import { logger } from "../lib/logger";
import { redisConnection } from "../config/redis";
import { imageCleanupProcessor } from "../processors/imageCleanup.processors";

export const imageCleanupWorker = new Worker(
  "image-cleanup",
  imageCleanupProcessor,
  {
    connection: redisConnection as any,
    concurrency: 5,
  },
);

imageCleanupWorker.on("completed", (job) => {
  logger.info(`Image cleanup job completed for product ${job.data.productId}`);
});

imageCleanupWorker.on("failed", (job, err) => {
  logger.error(
    `Image cleanup job failed for product ${job?.data.productId}:`,
    err,
  );
});
