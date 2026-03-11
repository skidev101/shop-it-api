import { registry } from "../openapi";
import { UserLoginRef, UserRegisterRef } from "../components";

registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  tags: ["Auth"],
  summary: "Register a new user",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: UserRegisterRef } },
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
      content: { "application/json": { schema: UserLoginRef } },
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