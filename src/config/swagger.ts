import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { generateDocs } from "../docs/openapi";

import "../docs/paths/auth.doc";
import "../docs/paths/product.doc";

export const setupSwagger = (app: Express) => {
  const docs = generateDocs();

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(docs));
  app.get("/docs.json", (req, res) => {
    res.json(docs);
  });
};
