import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string({ message: "Product name is required" }).min(3).max(100),
    description: z.string().min(10),
    price: z.number().positive("Price must be greater than 0"),
    category: z.string(),
    stock: z.number().int().nonnegative(),
    images: z.array(z.string().url()).min(1, "At least one image is required"),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>["body"];