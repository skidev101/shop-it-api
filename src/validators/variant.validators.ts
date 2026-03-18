import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid MongoDB ID format",
});

export const createVariantSchema = z.object({
  params: z.object({
    productId: objectIdSchema,
  }),
  body: z.object({
    price: z.number().positive(),
    stock: z.number().int().min(0),
    attributes: z.record(z.string(), z.string()).transform((attr) => {
      const normalized: Record<string, string> = {};
      for (const [key, value] of Object.entries(attr)) {
        normalized[key.trim().toLowerCase()] = value.trim().toLowerCase();
      }
      return normalized;
    }),
  }),
});
