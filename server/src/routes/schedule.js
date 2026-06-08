import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { createHttpError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import { serializeScheduleEntry } from '../utils/serializers.js';
import { normalizeDay, normalizeText } from '../utils/validation.js';

const router = express.Router();

router.use(authenticateToken, authorizeRoles('Teacher'));

function getSchedulePayload(body) {
  return {
    day: normalizeDay(body.day),
    time: normalizeText(body.time, 'Time'),
    subject: normalizeText(body.subject, 'Subject'),
  };
}

async function ensureUniqueSlot(teacherId, day, time, ignoreEntryId = null) {
  const existingEntry = await prisma.scheduleEntry.findFirst({
    where: {
      teacherId,
      day,
      time,
      id: ignoreEntryId ? { not: ignoreEntryId } : undefined,
    },
  });

  if (existingEntry) {
    throw createHttpError(409, 'A timetable slot already exists for that day and time.');
  }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const entries = await prisma.scheduleEntry.findMany({
      where: {
        teacherId: req.user.id,
      },
      orderBy: [
        { day: 'asc' },
        { time: 'asc' },
      ],
    });

    res.json(entries.map(serializeScheduleEntry));
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = getSchedulePayload(req.body);
    await ensureUniqueSlot(req.user.id, payload.day, payload.time);

    const entry = await prisma.scheduleEntry.create({
      data: {
        teacherId: req.user.id,
        day: payload.day,
        time: payload.time,
        subject: payload.subject,
      },
    });

    res.status(201).json(serializeScheduleEntry(entry));
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const entryId = normalizeText(req.params.id, 'Schedule entry id');
    const existingEntry = await prisma.scheduleEntry.findUnique({
      where: { id: entryId },
    });

    if (!existingEntry) {
      throw createHttpError(404, 'Schedule entry not found.');
    }

    if (existingEntry.teacherId !== req.user.id) {
      throw createHttpError(403, 'You can only edit your own timetable entries.');
    }

    const payload = getSchedulePayload({
      day: req.body.day ?? existingEntry.day,
      time: req.body.time ?? existingEntry.time,
      subject: req.body.subject ?? existingEntry.subject,
    });

    await ensureUniqueSlot(req.user.id, payload.day, payload.time, entryId);

    const entry = await prisma.scheduleEntry.update({
      where: { id: entryId },
      data: payload,
    });

    res.json(serializeScheduleEntry(entry));
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const entryId = normalizeText(req.params.id, 'Schedule entry id');
    const existingEntry = await prisma.scheduleEntry.findUnique({
      where: { id: entryId },
    });

    if (!existingEntry) {
      throw createHttpError(404, 'Schedule entry not found.');
    }

    if (existingEntry.teacherId !== req.user.id) {
      throw createHttpError(403, 'You can only delete your own timetable entries.');
    }

    await prisma.scheduleEntry.delete({
      where: { id: entryId },
    });

    res.status(204).send();
  }),
);

export default router;
