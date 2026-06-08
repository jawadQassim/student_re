import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { createHttpError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import { serializeUser } from '../utils/serializers.js';
import {
  normalizeEmail,
  normalizeRole,
  normalizeText,
} from '../utils/validation.js';

const router = express.Router();

router.use(authenticateToken, authorizeRoles('Admin'));

async function ensureUniqueUserFields({ email, username, ignoreUserId = null }) {
  const [emailOwner, usernameOwner] = await Promise.all([
    prisma.user.findFirst({
      where: {
        email,
        id: ignoreUserId ? { not: ignoreUserId } : undefined,
      },
    }),
    prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
        id: ignoreUserId ? { not: ignoreUserId } : undefined,
      },
    }),
  ]);

  if (emailOwner) {
    throw createHttpError(409, 'That email address is already in use.');
  }

  if (usernameOwner) {
    throw createHttpError(409, 'That username is already in use.');
  }
}

function getUserPayload(body) {
  return {
    role: normalizeRole(body.role),
    name: normalizeText(body.name, 'Name'),
    email: normalizeEmail(body.email),
    username: normalizeText(body.username, 'Username'),
    password: normalizeText(body.password, 'Password'),
    title: normalizeText(body.title, 'Title'),
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json(users.map((user) => serializeUser(user, { includePassword: true })));
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = getUserPayload(req.body);

    await ensureUniqueUserFields(payload);

    const user = await prisma.user.create({
      data: payload,
    });

    res.status(201).json(serializeUser(user, { includePassword: true }));
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = normalizeText(req.params.id, 'User id');
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw createHttpError(404, 'User not found.');
    }

    const payload = getUserPayload({
      role: req.body.role ?? existingUser.role,
      name: req.body.name ?? existingUser.name,
      email: req.body.email ?? existingUser.email,
      username: req.body.username ?? existingUser.username,
      password: req.body.password ?? existingUser.password,
      title: req.body.title ?? existingUser.title,
    });

    await ensureUniqueUserFields({
      email: payload.email,
      username: payload.username,
      ignoreUserId: userId,
    });

    const updatedUser = await prisma.$transaction(async (tx) => {
      if (existingUser.role === 'Teacher' && payload.role !== 'Teacher') {
        await tx.class.updateMany({
          where: { teacherId: userId },
          data: { teacherId: null },
        });
        await tx.grade.deleteMany({
          where: { teacherId: userId },
        });
        await tx.scheduleEntry.deleteMany({
          where: { teacherId: userId },
        });
      }

      if (existingUser.role === 'Student' && payload.role !== 'Student') {
        await tx.grade.deleteMany({
          where: { studentId: userId },
        });
        await tx.project.deleteMany({
          where: { studentId: userId },
        });
        await tx.classStudent.deleteMany({
          where: { studentId: userId },
        });
      }

      return tx.user.update({
        where: { id: userId },
        data: {
          role: payload.role,
          name: payload.name,
          email: payload.email,
          username: payload.username,
          password: payload.password,
          title: payload.title,
        },
      });
    });

    res.json(serializeUser(updatedUser, { includePassword: true }));
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = normalizeText(req.params.id, 'User id');
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw createHttpError(404, 'User not found.');
    }

    if (user.role === 'Admin') {
      const adminCount = await prisma.user.count({
        where: { role: 'Admin' },
      });

      if (adminCount <= 1) {
        throw createHttpError(400, 'You must keep at least one admin account.');
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(204).send();
  }),
);

export default router;
