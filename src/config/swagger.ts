import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { generateDocs } from "../docs/openapi";

import "../docs/paths/auth.doc";
import "../docs/paths/product.doc";
import "../docs/paths/order.doc";

export const setupSwagger = (app: Express) => {
  const docs = generateDocs();

  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(docs));
  app.get("/api/v1/docs.json", (_req, res) => {
    res.json(docs);
  });
};
