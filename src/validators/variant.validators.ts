import z from "zod";

export const createVariantSchema = z.object({
  body: z.object({
    productId: z.string().min(4, "ProductId must be at least 3 characers"),
    attributes: z.array(
      z.object({
        name: z.string().min(3, "Attribute name is too short"),
        value: z.string().min(3, "Attribute value is too short"),
      }),
    ),
    price: z.coerce.number().positive(),
    stock: z.coerce.number().int().positive(),
  }),
});
