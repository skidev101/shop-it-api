import { Request, Response } from "express";
// import { asyncHandler } from "../middlewares/errorHandler.middleware";
// import { getCloudinarySignature } from "../services/upload.service";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";

export const getCloudinarySignature = (_req: Request, res: Response) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = "merchant-atlas/products";

  // Create a signature using your API Secret
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    env.CLOUDINARY_SECRET
  );

  res.json({
    signature,
    timestamp,
    cloud_name: env.CLOUDINARY_NAME,
    api_key: env.CLOUDINARY_KEY,
    folder,
  });
};