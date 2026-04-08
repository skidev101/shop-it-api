import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

const idempotencyCache = new Map<string, any>();

export const idempotencyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;

  if (!idempotencyKey) {
    return next();
  }

  if (idempotencyCache.has(idempotencyKey)) {
    logger.info(`Idempotent request with key ${idempotencyKey} - returning cached response`);
    return res.json(idempotencyCache.get(idempotencyKey));
  }

  const originalSend = res.send.bind(res);
  res.send = (body: any) => {
    idempotencyCache.set(idempotencyKey, body);
    return originalSend(body);
  };

  next();
}