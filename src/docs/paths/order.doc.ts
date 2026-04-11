import { registry } from "../openapi";
import { CreateOrderRef } from "../components";


registry.registerPath({
  method: "post",
  path: "/api/orders/new",
  tags: ["Orders"],
  summary: "Create a new order",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateOrderRef } },
    },
  },
  responses: {
    201: { description: "Order created" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
  },
});
