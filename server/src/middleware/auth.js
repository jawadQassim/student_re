import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createHttpError } from './errorHandler.js';

export const authenticateToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization ?? '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw createHttpError(401, 'Authentication required.');
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw createHttpError(401, 'Invalid or expired token.');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
  });

  if (!user) {
    throw createHttpError(401, 'The authenticated user no longer exists.');
  }

  req.user = user;
  next();
});

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      next(createHttpError(401, 'Authentication required.'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(createHttpError(403, 'You do not have access to this resource.'));
      return;
    }

    next();
  };
}
