import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

function asDateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function loadDemoData() {
  try {
    return await import('../../src/data/demoUsers.js');
  } catch (error) {
    return import('./seedData.js');
  }
}

async function main() {
  const {
    initialClasses,
    initialGrades,
    initialProjects,
    initialScheduleEntries,
    initialUsers,
  } = await loadDemoData();
  const existingUsers = await prisma.user.count();

  if (existingUsers > 0) {
    console.log('Seed skipped because user records already exist.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.classStudent.deleteMany();
    await tx.grade.deleteMany();
    await tx.scheduleEntry.deleteMany();
    await tx.project.deleteMany();
    await tx.class.deleteMany();
    await tx.user.deleteMany();

    await tx.user.createMany({
      data: initialUsers.map((user) => ({
        id: user.id,
        role: Role[user.role],
        name: user.name,
        email: user.email,
        username: user.username,
        password: user.password,
        title: user.title,
      })),
    });

    for (const classItem of initialClasses) {
      await tx.class.create({
        data: {
          id: classItem.id,
          subject: classItem.subject,
          code: classItem.code,
          section: classItem.section,
          teacherId: classItem.teacherId || null,
          room: classItem.room,
          schedule: classItem.schedule,
          students: {
            create: (classItem.studentIds ?? []).map((studentId) => ({
              studentId,
            })),
          },
        },
      });
    }

    await tx.grade.createMany({
      data: initialGrades.map((grade) => ({
        id: grade.id,
        teacherId: grade.teacherId,
        studentId: grade.studentId,
        subject: grade.subject,
        grade: grade.grade,
        date: asDateOnly(grade.date),
      })),
    });

    await tx.scheduleEntry.createMany({
      data: initialScheduleEntries.map((entry) => ({
        id: entry.id,
        teacherId: entry.teacherId,
        day: entry.day,
        time: entry.time,
        subject: entry.subject,
      })),
    });

    await tx.project.createMany({
      data: initialProjects.map((project) => ({
        id: project.id,
        studentId: project.studentId,
        title: project.title,
        description: project.description,
        dueDate: asDateOnly(project.dueDate),
        status: project.status,
      })),
    });
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seeding failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
