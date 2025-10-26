import { Request, Response, NextFunction } from 'express';

// Error handling middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);
  
  // Default error response
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

// 404 handler
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({
    message: `Route ${req.method} ${req.path} not found`
  });
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
