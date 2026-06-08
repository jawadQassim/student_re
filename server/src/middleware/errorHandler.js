import { Prisma } from '@prisma/client';

export function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function notFoundHandler(req, res, next) {
  next(createHttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({
        message: 'A record with one of those unique values already exists.',
      });
      return;
    }
  }

  const statusCode = error.status ?? 500;
  const message = error.message ?? 'Internal server error.';

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({ message });
}
