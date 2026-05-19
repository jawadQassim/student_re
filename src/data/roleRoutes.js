export const roleSections = {
  Admin: [
    { id: 'overview', label: 'Home', path: '/admin' },
    { id: 'accounts', label: 'Accounts', path: '/admin/accounts' },
    { id: 'classes', label: 'Classes', path: '/admin/classes' },
    { id: 'directory', label: 'Directory', path: '/admin/directory' },
  ],
  Teacher: [
    { id: 'overview', label: 'Home', path: '/teacher' },
    { id: 'students', label: 'Students', path: '/teacher/students' },
    { id: 'grades', label: 'Grades', path: '/teacher/grades' },
    { id: 'schedule', label: 'Timetable', path: '/teacher/timetable' },
    { id: 'profile', label: 'Profile', path: '/teacher/profile' },
  ],
  Student: [
    { id: 'overview', label: 'Home', path: '/student' },
    { id: 'grades', label: 'Grades', path: '/student/grades' },
    { id: 'schedule', label: 'Timetable', path: '/student/timetable' },
    { id: 'projects', label: 'Projects', path: '/student/projects' },
    { id: 'profile', label: 'Profile', path: '/student/profile' },
  ],
};

export function getRoleHomePath(role) {
  return roleSections[role]?.[0]?.path ?? '/login';
}
