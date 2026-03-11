import { registry } from "./openapi";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { createProductSchema } from "../validators/product.validator";

// This creates the "Schemas" section at the bottom of Swagger UI
export const UserRegisterRef = registry.register("UserRegister", registerSchema.shape.body);
export const UserLoginRef = registry.register("UserLogin", loginSchema.shape.body);


export const CreateProductRef = registry.register("CreateProduct", createProductSchema.shape.body);