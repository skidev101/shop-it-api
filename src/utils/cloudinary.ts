import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../lib/logger';

export const deleteFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error(`Cloudinary Delete Failed: ${publicId}`, error);
  }
};