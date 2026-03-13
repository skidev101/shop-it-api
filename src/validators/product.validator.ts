import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

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
    basePrice: z.coerce
      .number()
      .positive("Price must be a positive number")
      .openapi({ example: 99.99 }),
    comparePrice: z.coerce
      .number()
      .positive("Price must be a positive number")
      .optional()
      .openapi({ example: 99.99 }),
    sku: z.string().optional().openapi({ example: "WBH-001" }),
    stock: z.coerce
      .number()
      .int("Stock must be an integer")
      .positive("Stock must be a positive number")
      .openapi({ example: 50 }),
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
          sku: z.string(),
          price: z.number().optional(),
          stock: z.number().positive("Stock must be a positive number"),
          attributes: z.array(
            z.object({
              name: z.string(),
              value: z.string(),
            }),
          ),
          images: z.array(
            z.object({
              url: z.url("Invalid image URL"),
              public_id: z.string(),
            }),
          ),
        }),
      )
      .optional()
      .openapi({
        example: [
          {
            sku: "WBH-001",
            stock: 50,
            price: 50,
            attributes: [{ name: "Color", value: "Red" }],
            images: [
              { url: "https://example.com/img1", public_id: "hello-world" },
            ],
          },
        ],
      }),

    tags: z
      .array(z.string())
      .optional()
      .openapi({ example: ["electronics", "audio", "wireless"] }),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
