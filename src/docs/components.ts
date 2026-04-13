import { registry } from "./openapi";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { createProductSchema } from "../validators/product.validator";
import { createOrderSchema } from "../validators/order.validators";

// This creates the "Schemas" section at the bottom of Swagger UI


// auth
export const UserRegisterRef = registry.register("UserRegister", registerSchema.shape.body);
export const UserLoginRef = registry.register("UserLogin", loginSchema.shape.body);


// products
export const CreateProductRef = registry.register("CreateProduct", createProductSchema.shape.body);


// orders
export const CreateOrderRef = registry.register("CreateOrder", createOrderSchema.shape.body);