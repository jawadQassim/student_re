function formatDateOnly(dateValue) {
  return dateValue.toISOString().slice(0, 10);
}

export function serializeUser(user, { includePassword = false } = {}) {
  const payload = {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    username: user.username,
    title: user.title,
  };

  if (includePassword) {
    payload.password = user.password;
  }

  return payload;
}

export function serializeClass(classRecord) {
  return {
    id: classRecord.id,
    subject: classRecord.subject,
    code: classRecord.code,
    section: classRecord.section,
    teacherId: classRecord.teacherId ?? '',
    room: classRecord.room,
    schedule: classRecord.schedule,
    studentIds: (classRecord.students ?? []).map((studentLink) => studentLink.studentId),
    teacher: classRecord.teacher ? serializeUser(classRecord.teacher) : null,
    students: (classRecord.students ?? [])
      .map((studentLink) => serializeUser(studentLink.student))
      .sort((firstStudent, secondStudent) => firstStudent.name.localeCompare(secondStudent.name)),
  };
}

export function serializeGrade(grade) {
  return {
    id: grade.id,
    teacherId: grade.teacherId,
    studentId: grade.studentId,
    subject: grade.subject,
    grade: grade.grade,
    date: formatDateOnly(grade.date),
    teacher: grade.teacher ? serializeUser(grade.teacher) : null,
    student: grade.student ? serializeUser(grade.student) : null,
  };
}

export function serializeScheduleEntry(entry) {
  return {
    id: entry.id,
    teacherId: entry.teacherId,
    day: entry.day,
    time: entry.time,
    subject: entry.subject,
  };
}

export function serializeProject(project) {
  return {
    id: project.id,
    studentId: project.studentId,
    title: project.title,
    description: project.description,
    dueDate: formatDateOnly(project.dueDate),
    status: project.status,
    student: project.student ? serializeUser(project.student) : null,
  };
}
