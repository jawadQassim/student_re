import { createContext, useContext, useState } from 'react';
import {
  initialClasses,
  initialGrades,
  initialProjects,
  initialScheduleEntries,
  initialUsers,
} from '../data/demoUsers';

const SchoolDataContext = createContext(null);

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SchoolDataProvider({ children }) {
  const [users, setUsers] = useState(initialUsers);
  const [classes, setClasses] = useState(initialClasses);
  const [grades, setGrades] = useState(initialGrades);
  const [scheduleEntries, setScheduleEntries] = useState(initialScheduleEntries);
  const [projects, setProjects] = useState(initialProjects);

  const createUser = (userData) => {
    const nextUser = {
      id: createId('user'),
      ...userData,
    };

    setUsers((currentUsers) => [...currentUsers, nextUser]);

    return nextUser;
  };

  const updateUser = (userId, userData) => {
    const existingUser = users.find((user) => user.id === userId);
    const nextRole = userData.role ?? existingUser?.role;

    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === userId ? { ...user, ...userData } : user)),
    );

    if (existingUser?.role === 'Teacher' && nextRole !== 'Teacher') {
      setClasses((currentClasses) =>
        currentClasses.map((classItem) =>
          classItem.teacherId === userId ? { ...classItem, teacherId: '' } : classItem,
        ),
      );
      setGrades((currentGrades) => currentGrades.filter((grade) => grade.teacherId !== userId));
      setScheduleEntries((currentEntries) =>
        currentEntries.filter((entry) => entry.teacherId !== userId),
      );
    }

    if (existingUser?.role === 'Student' && nextRole !== 'Student') {
      setGrades((currentGrades) => currentGrades.filter((grade) => grade.studentId !== userId));
      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.studentId !== userId),
      );
      setClasses((currentClasses) =>
        currentClasses.map((classItem) => ({
          ...classItem,
          studentIds: (classItem.studentIds ?? []).filter((studentId) => studentId !== userId),
        })),
      );
    }
  };

  const deleteUser = (userId) => {
    const existingUser = users.find((user) => user.id === userId);

    setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId));

    if (existingUser?.role === 'Teacher') {
      setClasses((currentClasses) =>
        currentClasses.map((classItem) =>
          classItem.teacherId === userId ? { ...classItem, teacherId: '' } : classItem,
        ),
      );
      setGrades((currentGrades) => currentGrades.filter((grade) => grade.teacherId !== userId));
      setScheduleEntries((currentEntries) =>
        currentEntries.filter((entry) => entry.teacherId !== userId),
      );
    }

    if (existingUser?.role === 'Student') {
      setClasses((currentClasses) =>
        currentClasses.map((classItem) => ({
          ...classItem,
          studentIds: (classItem.studentIds ?? []).filter((studentId) => studentId !== userId),
        })),
      );
      setGrades((currentGrades) => currentGrades.filter((grade) => grade.studentId !== userId));
      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.studentId !== userId),
      );
    }
  };

  const createClass = (classData) => {
    const nextClass = {
      id: createId('class'),
      studentIds: classData.studentIds ?? [],
      ...classData,
    };

    setClasses((currentClasses) => [...currentClasses, nextClass]);

    return nextClass;
  };

  const updateClass = (classId, classData) => {
    setClasses((currentClasses) =>
      currentClasses.map((classItem) =>
        classItem.id === classId ? { ...classItem, ...classData } : classItem,
      ),
    );
  };

  const deleteClass = (classId) => {
    setClasses((currentClasses) =>
      currentClasses.filter((classItem) => classItem.id !== classId),
    );
  };

  const createGrade = (gradeData) => {
    const nextGrade = {
      id: createId('grade'),
      ...gradeData,
    };

    setGrades((currentGrades) => [...currentGrades, nextGrade]);

    return nextGrade;
  };

  const updateGrade = (gradeId, gradeData) => {
    setGrades((currentGrades) =>
      currentGrades.map((grade) => (grade.id === gradeId ? { ...grade, ...gradeData } : grade)),
    );
  };

  const createScheduleEntry = (entryData) => {
    const nextEntry = {
      id: createId('schedule'),
      ...entryData,
    };

    setScheduleEntries((currentEntries) => [...currentEntries, nextEntry]);

    return nextEntry;
  };

  const updateScheduleEntry = (entryId, entryData) => {
    setScheduleEntries((currentEntries) =>
      currentEntries.map((entry) => (entry.id === entryId ? { ...entry, ...entryData } : entry)),
    );
  };

  const deleteScheduleEntry = (entryId) => {
    setScheduleEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== entryId),
    );
  };

  return (
    <SchoolDataContext.Provider
      value={{
        users,
        classes,
        grades,
        scheduleEntries,
        projects,
        createUser,
        updateUser,
        deleteUser,
        createClass,
        updateClass,
        deleteClass,
        createGrade,
        updateGrade,
        createScheduleEntry,
        updateScheduleEntry,
        deleteScheduleEntry,
      }}
    >
      {children}
    </SchoolDataContext.Provider>
  );
}

export function useSchoolData() {
  const context = useContext(SchoolDataContext);

  if (!context) {
    throw new Error('useSchoolData must be used within a SchoolDataProvider');
  }

  return context;
}
