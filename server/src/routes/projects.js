import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { createHttpError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import { serializeProject } from '../utils/serializers.js';
import { normalizeDateOnly, normalizeText } from '../utils/validation.js';

const router = express.Router();

router.use(authenticateToken, authorizeRoles('Admin', 'Teacher', 'Student'));

const projectInclude = {
  student: true,
};

function getProjectPayload(body) {
  return {
    studentId: normalizeText(body.studentId, 'Student id'),
    title: normalizeText(body.title, 'Title'),
    description: normalizeText(body.description, 'Description'),
    dueDate: normalizeDateOnly(body.dueDate, 'Due date'),
    status: normalizeText(body.status, 'Status'),
  };
}

async function assertTeacherCanManageStudentProject(teacherId, studentId) {
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
    throw createHttpError(403, 'Teachers can only manage projects for students in their assigned classes.');
  }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where =
      req.user.role === 'Admin'
        ? {}
        : req.user.role === 'Teacher'
          ? {
              student: {
                classEnrollments: {
                  some: {
                    class: {
                      teacherId: req.user.id,
                    },
                  },
                },
              },
            }
          : {
              studentId: req.user.id,
            };

    const projects = await prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: [
        { dueDate: 'asc' },
        { title: 'asc' },
      ],
    });

    res.json(projects.map(serializeProject));
  }),
);

router.post(
  '/',
  authorizeRoles('Admin', 'Teacher'),
  asyncHandler(async (req, res) => {
    const payload = getProjectPayload(req.body);

    if (req.user.role === 'Teacher') {
      await assertTeacherCanManageStudentProject(req.user.id, payload.studentId);
    }

    const project = await prisma.project.create({
      data: payload,
      include: projectInclude,
    });

    res.status(201).json(serializeProject(project));
  }),
);

router.put(
  '/:id',
  authorizeRoles('Admin', 'Teacher'),
  asyncHandler(async (req, res) => {
    const projectId = normalizeText(req.params.id, 'Project id');
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw createHttpError(404, 'Project not found.');
    }

    const payload = getProjectPayload({
      studentId: req.body.studentId ?? existingProject.studentId,
      title: req.body.title ?? existingProject.title,
      description: req.body.description ?? existingProject.description,
      dueDate:
        req.body.dueDate ??
        existingProject.dueDate.toISOString().slice(0, 10),
      status: req.body.status ?? existingProject.status,
    });

    if (req.user.role === 'Teacher') {
      await assertTeacherCanManageStudentProject(req.user.id, existingProject.studentId);
      await assertTeacherCanManageStudentProject(req.user.id, payload.studentId);
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: payload,
      include: projectInclude,
    });

    res.json(serializeProject(project));
  }),
);

router.delete(
  '/:id',
  authorizeRoles('Admin', 'Teacher'),
  asyncHandler(async (req, res) => {
    const projectId = normalizeText(req.params.id, 'Project id');
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw createHttpError(404, 'Project not found.');
    }

    if (req.user.role === 'Teacher') {
      await assertTeacherCanManageStudentProject(req.user.id, existingProject.studentId);
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    res.status(204).send();
  }),
);

export default router;
