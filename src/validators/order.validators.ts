import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const createOrderSchema = z.object({
    // items: z.array(
    //   z.object({
    //     productId: z.string().min(1).openapi({ example: "abc123" }),
    //     quantity: z.coerce
    //       .number()
    //       .int("Quantity must be an integer")
    //       .positive("Quantity must be a positive number")
    //       .openapi({ example: 2 }),
    //   }),
    // ),
  body: z.object({
    shippingAddress: z.object({
      fullName: z.string().min(1).openapi({ example: "John Doe" }),
      phone: z.string().min(1).openapi({ example: "+1234567890" }),
      street: z.string().min(1).openapi({ example: "123 Main St" }),
      city: z.string().min(1).openapi({ example: "Anytown" }),
      state: z.string().min(1).openapi({ example: "Somewhere" }),
      country: z.string().min(1).openapi({ example: "USA" }),
      postalCode: z.string().min(1).openapi({ example: "12345" }),
    }),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>["body"];
