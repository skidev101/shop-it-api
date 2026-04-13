import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const parseToJson = (val: any) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

export const createProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Product name must be at least 3 characters")
      .openapi({ example: "Wireless Bluetooth Headphones" }),
    description: z.string().min(10, "Description is too short").openapi({
      example:
        "High-quality wireless Bluetooth headphones with noise cancellation",
    }),
    basePrice: z.number().positive("Price must be a positive number"), // No more z.coerce needed if sending JSON
    comparePrice: z.number().positive().optional(),
    stock: z.number().int().positive(),
    category: z.string().min(1),

    // NEW: The image field(s) from Cloudinary
    images: z
      .array(
        z.object({
          url: z.url("Invalid image URL"),
          public_id: z.string(),
          isMain: z.boolean(),
        }),
      )
      .min(1, "At least one image is required"),

    // NO MORE parseToJson! Zod can handle arrays/objects directly in JSON
    specifications: z
      .record(z.string(), z.string())
      .optional()
      .openapi({
        example: { "Battery Life": "20 hours", Connectivity: "Bluetooth 5.0" },
      }),
    tags: z
      .array(z.string())
      .optional()
      .openapi({ example: ["electronics", "audio", "wireless"] }),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Product name must be at least 3 characters")
      .optional()
      .openapi({ example: "Wireless Bluetooth Headphones" }),
    description: z
      .string()
      .min(10, "Description is too short")
      .optional()
      .openapi({
        example:
          "High-quality wireless Bluetooth headphones with noise cancellation",
      }),
    basePrice: z.coerce
      .number()
      .positive("Price must be a positive number")
      .optional()
      .openapi({ example: 99.99 }),
    comparePrice: z.coerce
      .number()
      .positive("Price must be a positive number")
      .optional()
      .openapi({ example: 99.99 }),
    stock: z.coerce
      .number()
      .int("Stock must be an integer")
      .positive("Stock must be a positive number")
      .optional()
      .openapi({ example: 50 }),
    category: z.string().min(1).optional().openapi({ example: "Electronics" }),
    specifications: z.preprocess(
      parseToJson,
      z
        .record(z.string(), z.string())
        .optional()
        .openapi({
          example: {
            "Battery Life": "20 hours",
            Connectivity: "Bluetooth 5.0",
          },
        }),
    ),
    tags: z.preprocess(
      parseToJson,
      z
        .array(z.string())
        .optional()
        .openapi({ example: ["electronics", "audio", "wireless"] }),
    ),
  }),
});

export const updateProductStatusSchema = z.object({
  params: z.object({
    productId: z.string({ message: "productId must be of type string" }),
  }),
  body: z
    .object({
      isActive: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
      message: "At least one field must be provided",
    }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
export type UpdateProductInput = z.infer<
  typeof updateProductStatusSchema
>["body"];
