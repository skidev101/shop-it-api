// src/config/swagger.ts
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registerSchema, loginSchema } from "../../validators/auth.validator";
import { createProductSchema } from "../../validators/product.validator";
import { OpenAPIObject } from "@asteasolutions/zod-to-openapi/dist/types";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// ─── Security Schemes ─────────────────────────────────────────────────────────

registry.registerComponent("securitySchemes", "accessTokenCookie", {
  type: "apiKey",
  in: "cookie",
  name: "accessToken",
  description: "Access token — short-lived httpOnly cookie set automatically on login",
});

registry.registerComponent("securitySchemes", "refreshTokenCookie", {
  type: "apiKey",
  in: "cookie",
  name: "refreshToken",
  description: "Refresh token — httpOnly cookie set automatically on login",
});

// ─── Schemas ──────────────────────────────────────────────────────────────────

const RegisterBody   = registry.register("RegisterBody", registerSchema.shape.body);
const LoginBody      = registry.register("LoginBody", loginSchema.shape.body);
const CreateProductBody = registry.register("CreateProductBody", createProductSchema.shape.body);

// ─── Auth Routes ──────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  tags: ["Auth"],
  summary: "Register a new user",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: RegisterBody } },
    },
  },
  responses: {
    201: { description: "User registered successfully" },
    400: { description: "Validation error" },
    409: { description: "Email already in use" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  tags: ["Auth"],
  summary: "Login and receive tokens",
  description: "Returns an access token in the response body and sets a `refreshToken` and `accessToken` httpOnly cookie.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: LoginBody } },
    },
  },
  responses: {
    200: { description: "Login successful — access token returned, refresh cookie set" },
    400: { description: "Validation error" },
    401: { description: "Invalid credentials" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/refresh",
  tags: ["Auth"],
  summary: "Refresh access token",
  description: "Reads the `refreshToken` httpOnly cookie and issues a new access token.",
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: "New access token issued" },
    401: { description: "Missing or invalid refresh token" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/logout",
  tags: ["Auth"],
  summary: "Logout and clear cookie",
  security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  responses: {
    200: { description: "Logged out — refresh cookie cleared" },
    401: { description: "Unauthorized" },
  },
});

// ─── Product Routes ───────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/products",
  tags: ["Products"],
  summary: "Create a product",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateProductBody } },
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

// ─── Generator ────────────────────────────────────────────────────────────────

export function generateSwaggerSpec(): OpenAPIObject {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  // `as any` is intentional — openapi3-ts ships OAS30 + OAS31 types in the
  // same package and the library's return type references OAS31 internally,
  // causing a type mismatch that is a known upstream issue.
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Shop-It API",
      version: "1.0.0",
      description: "REST API for the Shop-It e-commerce platform",
    },
    servers: [
      { url: "http://localhost:3000", description: "Local dev" },
    ],
  } as any) as OpenAPIObject;
}