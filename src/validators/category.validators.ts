import z from "zod";



export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(3, "Category name must be at least 3 characters").openapi({ example: "Electronics" }),
    description: z.string().optional().openapi({ example: "All kinds of electronic gadgets and devices" }),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(3, "Category name must be at least 3 characters").optional().openapi({ example: "Electronics" }),
    description: z.string().optional().openapi({ example: "All kinds of electronic gadgets and devices" }),
    isActive: z.boolean().optional().openapi({ example: true }),
  }),
});