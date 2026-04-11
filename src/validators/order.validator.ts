import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);


export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      street: z.string().min(1).openapi({ example: "123 Main St" }),
      city: z.string().min(1).openapi({ example: "Anytown" }),
      country: z.string().min(1).openapi({ example: "USA" }),
      zipCode: z.string().min(1).openapi({ example: "12345" }),
    }),
    items: z.array(
      z.object({
        productId: z.string().min(1).openapi({ example: "abc123" }),
        quantity: z.coerce
          .number()
          .int("Quantity must be an integer")
          .positive("Quantity must be a positive number")
          .openapi({ example: 2 }),
      }),
    ),
  }),
});


export type CreateOrderInput = z.infer<typeof createOrderSchema>["body"];