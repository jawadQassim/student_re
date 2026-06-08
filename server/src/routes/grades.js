import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { createHttpError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import { serializeGrade } from '../utils/serializers.js';
import { normalizeDateOnly, normalizeText } from '../utils/validation.js';

const router = express.Router();

router.use(authenticateToken);

const gradeInclude = {
  teacher: true,
  student: true,
};

async function assertTeacherCanManageStudent(teacherId, studentId) {
  const linkedClass = await prisma.class.findFirst({
    where: {
      teacherId,
      students: {
        some: {
          studentId,
        },
      },
    },
  });

  if (!linkedClass) {
    throw createHttpError(403, 'Teachers can only manage grades for students in their assigned classes.');
  }
}

function getGradePayload(body) {
  return {
    studentId: normalizeText(body.studentId, 'Student id'),
    subject: normalizeText(body.subject, 'Subject'),
    grade: normalizeText(body.grade, 'Grade'),
    date: normalizeDateOnly(body.date, 'Date'),
  };
}

router.get(
  '/',
  authorizeRoles('Admin', 'Teacher', 'Student'),
  asyncHandler(async (req, res) => {
    const where =
      req.user.role === 'Admin'
        ? {}
        : req.user.role === 'Teacher'
          ? { teacherId: req.user.id }
          : { studentId: req.user.id };

    const grades = await prisma.grade.findMany({
      where,
      include: gradeInclude,
      orderBy: [
        { date: 'desc' },
        { subject: 'asc' },
      ],
    });

    res.json(grades.map(serializeGrade));
  }),
);

router.post(
  '/',
  authorizeRoles('Teacher'),
  asyncHandler(async (req, res) => {
    const payload = getGradePayload(req.body);
    await assertTeacherCanManageStudent(req.user.id, payload.studentId);

    const grade = await prisma.grade.create({
      data: {
        teacherId: req.user.id,
        studentId: payload.studentId,
        subject: payload.subject,
        grade: payload.grade,
        date: payload.date,
      },
      include: gradeInclude,
    });

    res.status(201).json(serializeGrade(grade));
  }),
);

router.put(
  '/:id',
  authorizeRoles('Teacher'),
  asyncHandler(async (req, res) => {
    const gradeId = normalizeText(req.params.id, 'Grade id');
    const existingGrade = await prisma.grade.findUnique({
      where: { id: gradeId },
    });

    if (!existingGrade) {
      throw createHttpError(404, 'Grade not found.');
    }

    if (existingGrade.teacherId !== req.user.id) {
      throw createHttpError(403, 'You can only edit grades that you created.');
    }

    const payload = getGradePayload({
      studentId: req.body.studentId ?? existingGrade.studentId,
      subject: req.body.subject ?? existingGrade.subject,
      grade: req.body.grade ?? existingGrade.grade,
      date:
        req.body.date ??
        existingGrade.date.toISOString().slice(0, 10),
    });

    await assertTeacherCanManageStudent(req.user.id, payload.studentId);

    const grade = await prisma.grade.update({
      where: { id: gradeId },
      data: {
        studentId: payload.studentId,
        subject: payload.subject,
        grade: payload.grade,
        date: payload.date,
      },
      include: gradeInclude,
    });

    res.json(serializeGrade(grade));
  }),
);

router.delete(
  '/:id',
  authorizeRoles('Teacher'),
  asyncHandler(async (req, res) => {
    const gradeId = normalizeText(req.params.id, 'Grade id');
    const existingGrade = await prisma.grade.findUnique({
      where: { id: gradeId },
    });

    if (!existingGrade) {
      throw createHttpError(404, 'Grade not found.');
    }

    if (existingGrade.teacherId !== req.user.id) {
      throw createHttpError(403, 'You can only delete grades that you created.');
    }

    await prisma.grade.delete({
      where: { id: gradeId },
    });

    res.status(204).send();
  }),
);

export default router;
