export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, true, "CONFLICT")
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public details?: any) {
    super(400, message, true, "VALIDATION_ERROR");
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`, true, "NOT_FOUND");
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized") {
    super(401, message, true, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "Forbidden") {
    super(403, message, true, "FORBIDDEN");
  }
}

export class InsufficientStockError extends ApiError {
  constructor(productId: string, available: number, requested: number) {
    super(
      409,
      `Insufficient stock for product ${productId}. Available: ${available}, Requested: ${requested}`,
      true,
      'INSUFFICIENT_STOCK'
    );
  }
}