import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const createProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Product name must be at least 3 characters")
      .openapi({ example: "Wireless Bluetooth Headphones" }),
    description: z.string().min(10, "Description is too short")
    .openapi({ example: "High-quality wireless Bluetooth headphones with noise cancellation" }),
    price: z.coerce
      .number()
      .positive("Price must be a positive number")
      .openapi({ example: 99.99 }),
    comparePrice: z.coerce
      .number()
      .positive()
      .optional()
      .openapi({ example: 149.99 }),
    category: z.string().min(1).openapi({ example: "Electronics" }),

    // Validate the images array
    images: z
      .array(z.url("Invalid image URL"))
      .min(1, "At least one image is required")
      .max(5, "You can upload a maximum of 5 images")
      .openapi({
        example: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
        ],
      }),

    // Variants and Specifications
    variants: z
      .array(
        z.object({
          name: z.string(),
          value: z.string(),
          price: z.number().optional(),
        }),
      )
      .optional()
      .openapi({ example: [{ name: "Color", value: "Red", price: 10 }] }),

    tags: z
      .array(z.string())
      .optional()
      .openapi({ example: ["electronics", "audio", "wireless"] }),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
