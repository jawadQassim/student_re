import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { createHttpError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import { serializeClass } from '../utils/serializers.js';
import { normalizeOptionalText, normalizeText } from '../utils/validation.js';

const router = express.Router();

router.use(authenticateToken);

const classInclude = {
  teacher: true,
  students: {
    include: {
      student: true,
    },
  },
};

async function validateTeacherId(teacherId) {
  if (!teacherId) {
    return null;
  }

  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
  });

  if (!teacher || teacher.role !== 'Teacher') {
    throw createHttpError(400, 'Teacher assignment must reference a teacher account.');
  }

  return teacherId;
}

async function validateStudentIds(studentIds) {
  const uniqueStudentIds = Array.from(new Set(studentIds.filter(Boolean)));

  if (!uniqueStudentIds.length) {
    return [];
  }

  const students = await prisma.user.findMany({
    where: {
      id: {
        in: uniqueStudentIds,
      },
      role: 'Student',
    },
  });

  if (students.length !== uniqueStudentIds.length) {
    throw createHttpError(400, 'Every class student must reference an existing student account.');
  }

  return uniqueStudentIds;
}

async function ensureUniqueClassCode(code, ignoreClassId = null) {
  const existingClass = await prisma.class.findFirst({
    where: {
      code,
      id: ignoreClassId ? { not: ignoreClassId } : undefined,
    },
  });

  if (existingClass) {
    throw createHttpError(409, 'That class code is already in use.');
  }
}

function getClassPayload(body) {
  return {
    subject: normalizeText(body.subject, 'Subject'),
    code: normalizeText(body.code, 'Code'),
    section: normalizeText(body.section, 'Section'),
    teacherId: normalizeOptionalText(body.teacherId),
    room: normalizeText(body.room, 'Room'),
    schedule: normalizeText(body.schedule, 'Schedule'),
    studentIds: Array.isArray(body.studentIds) ? body.studentIds.map((value) => `${value}`) : [],
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where =
      req.user.role === 'Admin'
        ? {}
        : req.user.role === 'Teacher'
          ? { teacherId: req.user.id }
          : {
              students: {
                some: {
                  studentId: req.user.id,
                },
              },
            };

    const classes = await prisma.class.findMany({
      where,
      include: classInclude,
      orderBy: [
        { subject: 'asc' },
        { section: 'asc' },
      ],
    });

    res.json(classes.map(serializeClass));
  }),
);

router.post(
  '/',
  authorizeRoles('Admin'),
  asyncHandler(async (req, res) => {
    const payload = getClassPayload(req.body);
    await ensureUniqueClassCode(payload.code);
    const [teacherId, studentIds] = await Promise.all([
      validateTeacherId(payload.teacherId),
      validateStudentIds(payload.studentIds),
    ]);

    const createdClass = await prisma.class.create({
      data: {
        subject: payload.subject,
        code: payload.code,
        section: payload.section,
        teacherId,
        room: payload.room,
        schedule: payload.schedule,
        students: {
          create: studentIds.map((studentId) => ({
            studentId,
          })),
        },
      },
      include: classInclude,
    });

    res.status(201).json(serializeClass(createdClass));
  }),
);

router.put(
  '/:id',
  authorizeRoles('Admin'),
  asyncHandler(async (req, res) => {
    const classId = normalizeText(req.params.id, 'Class id');
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!existingClass) {
      throw createHttpError(404, 'Class not found.');
    }

    const payload = getClassPayload({
      subject: req.body.subject ?? existingClass.subject,
      code: req.body.code ?? existingClass.code,
      section: req.body.section ?? existingClass.section,
      teacherId: req.body.teacherId ?? existingClass.teacherId ?? '',
      room: req.body.room ?? existingClass.room,
      schedule: req.body.schedule ?? existingClass.schedule,
      studentIds: req.body.studentIds,
    });

    await ensureUniqueClassCode(payload.code, classId);

    const teacherId = await validateTeacherId(payload.teacherId);
    const shouldReplaceStudents = Array.isArray(req.body.studentIds);
    const studentIds = shouldReplaceStudents ? await validateStudentIds(payload.studentIds) : [];

    const updatedClass = await prisma.$transaction(async (tx) => {
      await tx.class.update({
        where: { id: classId },
        data: {
          subject: payload.subject,
          code: payload.code,
          section: payload.section,
          teacherId,
          room: payload.room,
          schedule: payload.schedule,
        },
      });

      if (shouldReplaceStudents) {
        await tx.classStudent.deleteMany({
          where: { classId },
        });

        if (studentIds.length) {
          await tx.classStudent.createMany({
            data: studentIds.map((studentId) => ({
              classId,
              studentId,
            })),
          });
        }
      }

      return tx.class.findUnique({
        where: { id: classId },
        include: classInclude,
      });
    });

    res.json(serializeClass(updatedClass));
  }),
);

router.delete(
  '/:id',
  authorizeRoles('Admin'),
  asyncHandler(async (req, res) => {
    const classId = normalizeText(req.params.id, 'Class id');
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classItem) {
      throw createHttpError(404, 'Class not found.');
    }

    await prisma.class.delete({
      where: { id: classId },
    });

    res.status(204).send();
  }),
);

export default router;
