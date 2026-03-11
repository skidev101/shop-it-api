import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { OpenAPIObject } from "@asteasolutions/zod-to-openapi/dist/types";

export const registry = new OpenAPIRegistry();

// --- Security Schemes Registration ---
registry.registerComponent("securitySchemes", "accessTokenCookie", {
  type: "apiKey",
  in: "cookie",
  name: "accessToken",
  description:
    "Access token — short-lived httpOnly cookie set automatically on login",
});

registry.registerComponent("securitySchemes", "refreshTokenCookie", {
  type: "apiKey",
  in: "cookie",
  name: "refreshToken",
  description: "Refresh token — httpOnly cookie set automatically on login",
});

export function generateDocs(): OpenAPIObject {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "My API Documentation",
      version: "1.0.0",
    },
    servers: [{ url: "/api/v1" }],
  } as any) as OpenAPIObject;
}
