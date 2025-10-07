import { Request, Response, NextFunction } from 'express';

// Simple error handler
export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: {
      message
    }
  });
}

