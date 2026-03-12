import { Job } from "bullmq";
import { CloudinaryUtil } from "../utils/cloudinary";
import { logger } from "../lib/logger";

export const imageCleanupProcessor = async (job: Job) => {
  const { productId, publicIds } = job.data;

  logger.info(`Cleaning images for product ${productId}`);

  if (publicIds?.length) {
    await CloudinaryUtil.deleteMultipleFiles(publicIds);
  }

  return true;
};