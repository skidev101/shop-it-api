// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError, NotFoundError } from '../utils/api-errors';
// import { MongoError } from 'mongodb';
import mongoose from 'mongoose';
import { logger } from '../lib/logger';
import z from 'zod';

interface ErrorResponse {
  status: 'error';
  statusCode: number;
  message: string;
  code?: string | undefined;
  details?: any;
  stack?: string | undefined;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Zod validation errors
  if (err instanceof z.ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message
    }))
    error = new ApiError(400, "validation failed", true, "VALIDATION_ERROR");
    (error as any).details = details
  }

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = new ApiError(400, 'Validation failed', true, 'VALIDATION_ERROR');
    (error as any).details = details;
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    error = new ApiError(400, `Invalid ${err.path}: ${err.value}`, true, 'INVALID_ID');
  }

  // Handle MongoDB duplicate key errors
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0] || "Field";
    error = new ApiError(
      409,
      `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      true,
      'DUPLICATE_KEY'
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token', true, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired', true, 'TOKEN_EXPIRED');
  }

  // Default to AppError or create one
  const appError = error instanceof ApiError 
    ? error 
    : new ApiError(500, 'Internal server error', false);

  const errorResponse: ErrorResponse = {
    status: 'error',
    statusCode: appError.statusCode,
    message: appError.message,
    code: appError.code,
  };

  // Add details if they exist
  if ((appError as any).details) {
    errorResponse.details = (appError as any).details;
  }

  // Log error
  if (appError.statusCode >= 500) {
    logger.error('Server Error:', {
      message: appError.message,
      statusCode: appError.statusCode,
      stack: appError.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userId: (req as any).user?.userId,
    });
  } else {
    logger.warn('Client Error:', {
      message: appError.message,
      statusCode: appError.statusCode,
      url: req.url,
      method: req.method,
    });
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = appError.stack;
  }

  res.status(appError.statusCode).json(errorResponse);
};

// Handle 404 routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.originalUrl}`));
};

// Async handler wrapper to catch async errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};