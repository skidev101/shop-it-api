import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../lib/logger';

export const CloudinaryUtil = {
  async deleteFile(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'ok') {
        logger.warn(`Cloudinary delete returned status: ${result.result} for ID: ${publicId}`);
      }
    } catch (error) {
      logger.error(`Failed to delete from Cloudinary: ${publicId}`, error);
    }
  },


  async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    if (!publicIds.length) return;
    await Promise.all(publicIds.map((id) => this.deleteFile(id)));
  }
};