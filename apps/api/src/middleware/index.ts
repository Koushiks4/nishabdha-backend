import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ApiResponse } from '@nishabdha/types';
import { config } from '../config';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
) => {
  // Log full error in development, minimal in production
  if (config.nodeEnv === 'development') {
    logger.error('Error details:', { error: err, stack: err.stack });
  } else {
    logger.error('Error:', { message: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
  });
};

export const notFound = (req: Request, res: Response<ApiResponse>) => {
  logger.warn('Route not found', { method: req.method, path: req.path });
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};
