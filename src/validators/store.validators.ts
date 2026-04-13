import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);


export const createStoreSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100).openapi({ example: "My Store" }),
    description: z.string().max(255).optional().openapi({ example: "A great store!" }),
  }),
});



export type CreateStoreInput = z.infer<typeof createStoreSchema>["body"];