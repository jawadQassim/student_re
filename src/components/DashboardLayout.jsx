import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchoolData } from '../context/SchoolDataContext';
import { useTheme } from '../context/ThemeContext';
import { getRoleHomePath, roleSections } from '../data/roleRoutes';
import AdminPanel from './AdminPanel';
import StudentPanel from './StudentPanel';
import TeacherPanel from './TeacherPanel';

const teacherDayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function formatShortDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getNumericGrade(gradeValue) {
  const numericGrade = Number.parseFloat(gradeValue);

  if (!Number.isNaN(numericGrade)) {
    return Math.max(0, Math.min(100, numericGrade));
  }

  const normalizedGrade = gradeValue.trim().toUpperCase();
  const gradeMap = {
    'A+': 98,
    A: 95,
    'A-': 91,
    'B+': 88,
    B: 85,
    'B-': 81,
    'C+': 78,
    C: 75,
    'C-': 71,
    'D+': 68,
    D: 65,
    'D-': 61,
    PASS: 75,
  };

  return gradeMap[normalizedGrade] ?? 0;
}

function getGpaLabel(studentGrades) {
  if (!studentGrades.length) {
    return '0.0';
  }

  const gradeAverage =
    studentGrades.reduce((total, grade) => total + getNumericGrade(grade.grade), 0) /
    studentGrades.length;
  const gpa = (gradeAverage / 25).toFixed(1);

  return gpa;
}

function getNextTeacherScheduleEntry(user, scheduleEntries) {
  return [...scheduleEntries]
    .filter((entry) => entry.teacherId === user.id)
    .sort((firstEntry, secondEntry) => {
      const firstDayIndex = teacherDayOrder.indexOf(firstEntry.day);
      const secondDayIndex = teacherDayOrder.indexOf(secondEntry.day);

      if (firstDayIndex !== secondDayIndex) {
        return firstDayIndex - secondDayIndex;
      }

      return firstEntry.time.localeCompare(secondEntry.time);
    })[0];
}

function getAdminDashboardConfig(users, classes) {
  const studentCount = users.filter((candidate) => candidate.role === 'Student').length;
  const teacherCount = users.filter((candidate) => candidate.role === 'Teacher').length;
  const unassignedClasses = classes.filter((classItem) => !classItem.teacherId).length;

  return {
    title: 'Admin Control Center',
    subtitle: 'Manage school accounts, classes, and the full user directory from one shared workspace.',
    note: unassignedClasses
      ? `${unassignedClasses} classes still need a teacher`
      : 'All current classes are staffed',
    stats: [
      { label: 'Total Students', value: String(studentCount), trend: 'Student records currently in the system' },
      { label: 'Total Teachers', value: String(teacherCount), trend: 'Teacher profiles ready to manage' },
      { label: 'Classes and Subjects', value: String(classes.length), trend: 'Sections active across the school' },
      { label: 'Unassigned Classes', value: String(unassignedClasses), trend: 'Classes waiting for a teacher' },
    ],
    sections: roleSections.Admin,
  };
}

function getTeacherDashboardConfig(user, classes, grades, scheduleEntries) {
  const teacherClasses = classes.filter((classItem) => classItem.teacherId === user.id);
  const assignedStudentCount = new Set(
    teacherClasses.flatMap((classItem) =>
      classItem.students?.length
        ? classItem.students.map((student) => student.id)
        : classItem.studentIds ?? [],
    ),
  ).size;
  const teacherGrades = grades.filter((grade) => grade.teacherId === user.id);
  const teacherSchedule = scheduleEntries.filter((entry) => entry.teacherId === user.id);
  const taughtSubjects = new Set(
    [
      ...teacherClasses.map((classItem) => classItem.subject),
      ...teacherSchedule.map((entry) => entry.subject),
    ].filter(Boolean),
  ).size;
  const nextScheduleEntry = getNextTeacherScheduleEntry(user, scheduleEntries);

  return {
    title: 'Teacher Workspace',
    subtitle: 'Manage your students, gradebook, timetable, and profile from one focused teaching view.',
    note: nextScheduleEntry
      ? `Next block: ${nextScheduleEntry.day} at ${nextScheduleEntry.time}`
      : 'Add your first timetable block',
    stats: [
      { label: 'Assigned Students', value: String(assignedStudentCount), trend: 'Students linked to your classes' },
      { label: 'Grades Given', value: String(teacherGrades.length), trend: 'Assessment records currently logged' },
      { label: 'Weekly Timetable Slots', value: String(teacherSchedule.length), trend: 'Schedule blocks you currently manage' },
      { label: 'Subjects Taught', value: String(taughtSubjects), trend: `${teacherClasses.length} assigned class sections` },
    ],
    sections: roleSections.Teacher,
  };
}

function getStudentDashboardConfig(user, classes, grades, projects) {
  const studentClasses = classes.filter((classItem) => (classItem.studentIds ?? []).includes(user.id));
  const studentGrades = grades.filter((grade) => grade.studentId === user.id);
  const studentProjects = projects.filter((project) => project.studentId === user.id);
  const pendingProjects = studentProjects.filter(
    (project) => project.status.toLowerCase() === 'pending',
  );
  const completedProjects = studentProjects.filter(
    (project) => project.status.toLowerCase() === 'done',
  );
  const nextPendingProject = [...pendingProjects].sort((firstProject, secondProject) =>
    firstProject.dueDate.localeCompare(secondProject.dueDate),
  )[0];

  return {
    title: 'Student Dashboard',
    subtitle: 'Review your grades, weekly timetable, assigned projects, and personal profile in one read-only view.',
    note: nextPendingProject
      ? `Next project due ${formatShortDate(nextPendingProject.dueDate)}`
      : 'No pending projects right now',
    stats: [
      { label: 'Current GPA', value: getGpaLabel(studentGrades), trend: 'Based on the grades currently visible' },
      { label: 'Scheduled Classes', value: String(studentClasses.length), trend: 'Current subjects on your timetable' },
      { label: 'Pending Projects', value: String(pendingProjects.length), trend: 'Assignments that still need completion' },
      { label: 'Completed Projects', value: String(completedProjects.length), trend: 'Projects already marked done' },
    ],
    sections: roleSections.Student,
  };
}

function getRoleNotifications(user, users, classes, grades, scheduleEntries, projects) {
  if (user.role === 'Admin') {
    const studentCount = users.filter((candidate) => candidate.role === 'Student').length;
    const teacherCount = users.filter((candidate) => candidate.role === 'Teacher').length;
    const unassignedClasses = classes.filter((classItem) => !classItem.teacherId).length;

    return [
      {
        id: 'admin-alert-1',
        title: `${studentCount} student records are active`,
        detail: 'Directory totals refreshed from the live backend data.',
      },
      {
        id: 'admin-alert-2',
        title: `${teacherCount} teacher profiles available`,
        detail: 'Faculty staffing data is ready for review.',
      },
      {
        id: 'admin-alert-3',
        title: unassignedClasses
          ? `${unassignedClasses} classes still need staffing`
          : 'All current classes have a teacher assigned',
        detail: 'Check the classes page for assignment updates.',
      },
    ];
  }

  if (user.role === 'Teacher') {
    const teacherGrades = grades.filter((grade) => grade.teacherId === user.id);
    const teacherClasses = classes.filter((classItem) => classItem.teacherId === user.id);
    const nextScheduleEntry = getNextTeacherScheduleEntry(user, scheduleEntries);

    return [
      {
        id: 'teacher-alert-1',
        title: `${teacherGrades.length} grade entries logged`,
        detail: 'Your gradebook is up to date with the latest backend records.',
      },
      {
        id: 'teacher-alert-2',
        title: `${teacherClasses.length} classes linked to your account`,
        detail: 'Assigned students and subjects are visible from the student view.',
      },
      {
        id: 'teacher-alert-3',
        title: nextScheduleEntry
          ? `Next timetable block: ${nextScheduleEntry.subject}`
          : 'No timetable blocks scheduled yet',
        detail: nextScheduleEntry
          ? `${nextScheduleEntry.day} at ${nextScheduleEntry.time}`
          : 'Add a weekly slot to build out your schedule.',
      },
    ];
  }

  const studentGrades = grades.filter((grade) => grade.studentId === user.id);
  const studentProjects = projects.filter((project) => project.studentId === user.id);
  const nextPendingProject = [...studentProjects]
    .filter((project) => project.status.toLowerCase() === 'pending')
    .sort((firstProject, secondProject) => firstProject.dueDate.localeCompare(secondProject.dueDate))[0];
  const latestGrade = [...studentGrades].sort((firstGrade, secondGrade) =>
    secondGrade.date.localeCompare(firstGrade.date),
  )[0];

  return [
    {
      id: 'student-alert-1',
      title: latestGrade
        ? `Latest grade posted in ${latestGrade.subject}`
        : 'No grades have been posted yet',
      detail: latestGrade
        ? `${latestGrade.grade} recorded on ${formatShortDate(latestGrade.date)}`
        : 'Your teachers will add assessment results here.',
    },
    {
      id: 'student-alert-2',
      title: nextPendingProject
        ? `Upcoming project: ${nextPendingProject.title}`
        : 'No pending projects right now',
      detail: nextPendingProject
        ? `Due ${formatShortDate(nextPendingProject.dueDate)}`
        : 'You are all caught up for now.',
    },
    {
      id: 'student-alert-3',
      title: `${studentProjects.length} projects visible in your workspace`,
      detail: 'Track status updates from the projects page.',
    },
  ];
}

function BellIcon() {
  return (
    <svg aria-hidden="true" className="icon-svg" viewBox="0 0 24 24">
      <path
        d="M12 3a4 4 0 0 0-4 4v1.18c0 .82-.24 1.62-.7 2.3L6 12.5V16h12v-3.5l-1.3-2.02a4.2 4.2 0 0 1-.7-2.3V7a4 4 0 0 0-4-4Zm0 18a2.8 2.8 0 0 0 2.63-1.88H9.37A2.8 2.8 0 0 0 12 21Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" className="icon-svg" viewBox="0 0 24 24">
      <path
        d="M12 6.25A5.75 5.75 0 1 0 17.75 12 5.76 5.76 0 0 0 12 6.25Zm0-4.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 2Zm0 17.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm10-8.25a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1 0-1.5H22ZM4.25 12a.75.75 0 0 1-.75.75H2a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm14.82-6.32a.75.75 0 0 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06Zm-12.2 12.2a.75.75 0 1 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06Zm13.26 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 1.06-1.06l1.06 1.06ZM7.93 7.8a.75.75 0 1 1-1.06-1.06L7.93 5.68A.75.75 0 1 1 9 6.74L7.93 7.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" className="icon-svg" viewBox="0 0 24 24">
      <path
        d="M14.9 2.2a.75.75 0 0 1 .8.97A8.5 8.5 0 1 0 20.83 13a.75.75 0 0 1 .97.8A10 10 0 1 1 14.1 2.2a.75.75 0 0 1 .8 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DashboardLoadingState() {
  return (
    <div className="content-area page-reveal">
      <section className="hero-card loading-card">
        <div className="skeleton-line wide" />
        <div className="skeleton-line medium" />
      </section>

      <section className="stats-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <article className="stat-card loading-card" key={`stat-skeleton-${index}`}>
            <div className="skeleton-line short" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line short" />
          </article>
        ))}
      </section>

      <section className="detail-grid admin-detail-grid">
        <article className="detail-card loading-card">
          <div className="skeleton-line medium" />
          <div className="skeleton-line wide" />
          <div className="skeleton-stack">
            <div className="skeleton-line wide" />
            <div className="skeleton-line wide" />
            <div className="skeleton-line medium" />
          </div>
        </article>
        <article className="detail-card loading-card">
          <div className="skeleton-line medium" />
          <div className="skeleton-line wide" />
          <div className="skeleton-stack">
            <div className="skeleton-line wide" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line short" />
          </div>
        </article>
      </section>
    </div>
  );
}

function DashboardErrorState({ message }) {
  return (
    <div className="content-area page-reveal">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Data error</span>
          <h2>We couldn&apos;t load this dashboard</h2>
          <p>{message}</p>
        </div>
      </section>
    </div>
  );
}

function DashboardLayout() {
  const { user, logout } = useAuth();
  const { users, classes, grades, scheduleEntries, projects, isLoading, error } = useSchoolData();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const config =
    user.role === 'Admin'
      ? getAdminDashboardConfig(users, classes)
      : user.role === 'Teacher'
        ? getTeacherDashboardConfig(user, classes, grades, scheduleEntries)
        : getStudentDashboardConfig(user, classes, grades, projects);
  const activeSection =
    config.sections.find((section) => section.path === location.pathname) ?? null;
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const notifications = useMemo(
    () => getRoleNotifications(user, users, classes, grades, scheduleEntries, projects),
    [classes, grades, projects, scheduleEntries, user, users],
  );

  useEffect(() => {
    if (!activeSection) {
      navigate(getRoleHomePath(user.role), { replace: true });
    }
  }, [activeSection, navigate, user.role]);

  useEffect(() => {
    setShowNotifications(false);
    setIsPageLoading(true);

    const timer = window.setTimeout(() => {
      setIsPageLoading(false);
    }, 240);

    return () => {
      window.clearTimeout(timer);
    };
  }, [location.pathname]);

  if (!activeSection) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">BR</div>
          <div>
            <strong>Blue Ridge Academy</strong>
            <span>School Management Suite</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {config.sections.map((section) => (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              key={section.path}
              to={section.path}
            >
              <span>{section.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-promo">
          <span className="eyebrow">Workspace note</span>
          <strong>{config.note}</strong>
          <p>{config.subtitle}</p>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h1>{activeSection.label}</h1>
          </div>

          <div className="topbar-actions">
            <div className="toolbar-icon-group">
              <div className="notification-wrap">
                <button
                  aria-label="Open notifications"
                  className="icon-button"
                  type="button"
                  onClick={() => setShowNotifications((currentState) => !currentState)}
                >
                  <BellIcon />
                  <span className="icon-badge">{notifications.length}</span>
                </button>

                {showNotifications ? (
                  <div className="notification-panel">
                    <div className="notification-header">
                      <strong>Alerts</strong>
                      <span>{user.role}</span>
                    </div>
                    <div className="notification-list">
                      {notifications.map((notification) => (
                        <article className="notification-item" key={notification.id}>
                          <strong>{notification.title}</strong>
                          <p>{notification.detail}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="icon-button"
                type="button"
                onClick={toggleTheme}
              >
                {isDarkMode ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>

            <div className="user-chip">
              <div className="user-avatar">{initials}</div>
              <div>
                <strong>{user.name}</strong>
                <span>
                  {user.role} | {user.title}
                </span>
              </div>
            </div>

            <button className="ghost-button" type="button" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </header>

        {error ? (
          <DashboardErrorState message={error.message ?? 'Please try refreshing the page.'} />
        ) : isPageLoading || isLoading ? (
          <DashboardLoadingState />
        ) : (
          <main className="content-area page-reveal">
            <section className="hero-card">
              <div>
                <span className="eyebrow">Role-based workspace</span>
                <h2>{config.title}</h2>
                <p>{config.subtitle}</p>
              </div>
              <div className="hero-pill">
                <strong>{user.role}</strong>
                <span>{user.username}</span>
              </div>
            </section>

            <section className="stats-grid">
              {config.stats.map((stat) => (
                <article className="stat-card" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <p>{stat.trend}</p>
                </article>
              ))}
            </section>

            {user.role === 'Admin' ? (
              <AdminPanel activeSectionId={activeSection.id} />
            ) : user.role === 'Teacher' ? (
              <TeacherPanel activeSectionId={activeSection.id} teacher={user} />
            ) : (
              <StudentPanel activeSectionId={activeSection.id} student={user} />
            )}
          </main>
        )}
      </div>
    </div>
  );
}

export default DashboardLayout;
