import { Job } from "bullmq";
import { CloudinaryUtil } from "../utils/cloudinary";
import { logger } from "../lib/logger";

export const imageCleanupProcessor = async (job: Job) => {
  const { productId, publicIds } = job.data;
  if (!publicIds.length) return;

  logger.info(`Cleaning images for product ${productId}`);

  await CloudinaryUtil.deleteMultipleFiles(publicIds);

  return {
    success: true,
    deleted: publicIds.length,
  };
};
