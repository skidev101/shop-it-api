import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";


extendZodWithOpenApi(z);

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "First name is too short").openapi({ example: "John" }),
    lastName: z.string().min(2, "Last name is too short").openapi({ example: "Doe" }),
    email: z.string().email("Invalid email address").openapi({ example: "john.doe@example.com" }),
    password: z.string().min(8, "Password must be at least 8 characters").openapi({ example: "password123" }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").openapi({ example: "john.doe@example.com" }),
    password: z.string().min(1, "Password is required").openapi({ example: "password123" }),
  }),
});


export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];