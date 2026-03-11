import { registry } from "../openapi";
import { CreateProductRef } from "../components";


registry.registerPath({
  method: "post",
  path: "/api/products",
  tags: ["Products"],
  summary: "Create a product",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateProductRef } },
    },
  },
  responses: {
    201: { description: "Product created" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/products",
  tags: ["Products"],
  summary: "List all products",
  responses: {
    200: { description: "Array of products" },
  },
});