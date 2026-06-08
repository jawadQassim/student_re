import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { createHttpError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLE_ORDER } from '../utils/constants.js';
import { serializeUser } from '../utils/serializers.js';
import { normalizeRole, normalizeText } from '../utils/validation.js';

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    },
  );
}

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const username = normalizeText(req.body.username, 'Username').toLowerCase();
    const password = normalizeText(req.body.password, 'Password');
    const role = normalizeRole(req.body.role);

    const account = await prisma.user.findFirst({
      where: {
        role,
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });

    if (!account || account.password !== password) {
      throw createHttpError(
        401,
        'Credentials do not match the selected role. Try one of the demo accounts below.',
      );
    }

    res.json({
      token: signToken(account),
      user: serializeUser(account),
    });
  }),
);

router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    res.json({
      user: serializeUser(req.user),
    });
  }),
);

router.get(
  '/demo-accounts',
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    });

    const accounts = ROLE_ORDER.map((role) => users.find((user) => user.role === role))
      .filter(Boolean)
      .map((user) => serializeUser(user, { includePassword: true }));

    res.json(accounts);
  }),
);

export default router;
