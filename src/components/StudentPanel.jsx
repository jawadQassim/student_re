import { useSchoolData } from '../context/SchoolDataContext';

function formatDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StudentPanel({ activeSectionId, student }) {
  const { classes, grades, projects } = useSchoolData();

  const studentClasses = [...classes].sort(
    (firstClass, secondClass) =>
      firstClass.subject.localeCompare(secondClass.subject) ||
      firstClass.section.localeCompare(secondClass.section),
  );
  const studentGrades = [...grades].sort(
    (firstGrade, secondGrade) =>
      secondGrade.date.localeCompare(firstGrade.date) ||
      firstGrade.subject.localeCompare(secondGrade.subject),
  );
  const studentProjects = [...projects].sort((firstProject, secondProject) =>
    firstProject.dueDate.localeCompare(secondProject.dueDate),
  );
  const pendingProjects = studentProjects.filter(
    (project) => project.status.toLowerCase() === 'pending',
  );
  const completedProjects = studentProjects.filter(
    (project) => project.status.toLowerCase() === 'done',
  );
  const classLabel = studentClasses.length
    ? Array.from(new Set(studentClasses.map((classItem) => classItem.section))).join(', ')
    : student.title;
  const teacherNames = new Map([
    ...studentClasses
      .filter((classItem) => classItem.teacher)
      .map((classItem) => [classItem.teacherId, classItem.teacher.name]),
    ...studentGrades
      .filter((grade) => grade.teacher)
      .map((grade) => [grade.teacherId, grade.teacher.name]),
  ]);

  const getTeacherName = (teacherId) => teacherNames.get(teacherId) ?? 'Unassigned';

  const renderOverviewSection = () => (
    <section className="admin-panel">
      <article className="detail-card admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <span className="eyebrow">Overview</span>
            <h3>Your student dashboard at a glance</h3>
            <p>Check your latest grades, class timetable, and project deadlines from one calm view.</p>
          </div>
        </div>

        <div className="overview-grid">
          <article className="mini-card">
            <span>Grade records</span>
            <strong>{studentGrades.length}</strong>
            <p>Assessment updates currently visible in your grade table.</p>
          </article>
          <article className="mini-card">
            <span>Scheduled classes</span>
            <strong>{studentClasses.length}</strong>
            <p>Subjects currently attached to your timetable.</p>
          </article>
          <article className="mini-card">
            <span>Pending projects</span>
            <strong>{pendingProjects.length}</strong>
            <p>Assignments that still need your attention.</p>
          </article>
          <article className="mini-card">
            <span>Completed projects</span>
            <strong>{completedProjects.length}</strong>
            <p>Work you have already marked as done.</p>
          </article>
        </div>
      </article>

      <section className="detail-grid admin-detail-grid">
        <article className="detail-card">
          <div className="section-heading">
            <span className="eyebrow">Recent grades</span>
            <h3>Latest academic results</h3>
            <p>Your most recent grade entries with subject and teacher context.</p>
          </div>

          <div className="compact-list">
            {studentGrades.length ? (
              studentGrades.slice(0, 5).map((grade) => (
                <div className="compact-list-item" key={grade.id}>
                  <div>
                    <strong>{grade.subject}</strong>
                    <p>
                      {formatDate(grade.date)} | {grade.teacher?.name ?? getTeacherName(grade.teacherId)}
                    </p>
                  </div>
                  <span className="table-note">{grade.grade}</span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>No grades yet.</strong>
                <p>Your grade table will populate as teachers add assessment records.</p>
              </div>
            )}
          </div>
        </article>

        <article className="detail-card">
          <div className="section-heading">
            <span className="eyebrow">Project tracker</span>
            <h3>Upcoming work</h3>
            <p>Read-only project milestones and due dates assigned to your account.</p>
          </div>

          <div className="compact-list">
            {studentProjects.length ? (
              studentProjects.slice(0, 4).map((project) => (
                <div className="compact-list-item" key={project.id}>
                  <div>
                    <strong>{project.title}</strong>
                    <p>Due {formatDate(project.dueDate)}</p>
                  </div>
                  <span
                    className={
                      project.status.toLowerCase() === 'done'
                        ? 'status-badge done'
                        : 'status-badge pending'
                    }
                  >
                    {project.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>No projects assigned yet.</strong>
                <p>New projects will appear here once they are added to your student record.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </section>
  );

  const renderGradesSection = () => (
    <section className="admin-panel">
      <article className="detail-card admin-card">
        <div className="section-heading">
          <span className="eyebrow">Grades</span>
          <h3>Your grades</h3>
          <p>Every grade currently attached to your student record, including subject, teacher, and date.</p>
        </div>

        <div className="table-shell">
          {studentGrades.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Grade</th>
                  <th>Date</th>
                  <th>Teacher</th>
                </tr>
              </thead>
              <tbody>
                {studentGrades.map((grade) => (
                  <tr key={grade.id}>
                    <td>{grade.subject}</td>
                    <td>{grade.grade}</td>
                    <td>{formatDate(grade.date)}</td>
                    <td>{grade.teacher?.name ?? getTeacherName(grade.teacherId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <strong>No grades yet.</strong>
              <p>Your teachers have not added any grade entries for you yet.</p>
            </div>
          )}
        </div>
      </article>
    </section>
  );

  const renderScheduleSection = () => (
    <section className="admin-panel">
      <article className="detail-card admin-card">
        <div className="section-heading">
          <span className="eyebrow">Timetable</span>
          <h3>Your weekly schedule</h3>
          <p>See your assigned classes with room, section, schedule, and teacher details.</p>
        </div>

        <div className="table-shell">
          {studentClasses.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Section</th>
                  <th>Schedule</th>
                  <th>Room</th>
                  <th>Teacher</th>
                </tr>
              </thead>
              <tbody>
                {studentClasses.map((classItem) => (
                  <tr key={classItem.id}>
                    <td>{classItem.subject}</td>
                    <td>{classItem.section}</td>
                    <td>{classItem.schedule}</td>
                    <td>{classItem.room}</td>
                    <td>{classItem.teacher?.name ?? getTeacherName(classItem.teacherId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <strong>No classes assigned yet.</strong>
              <p>Your timetable will appear once classes are linked to your student record.</p>
            </div>
          )}
        </div>
      </article>
    </section>
  );

  const renderProjectsSection = () => (
    <section className="admin-panel">
      <article className="detail-card admin-card">
        <div className="section-heading">
          <span className="eyebrow">Projects</span>
          <h3>Assigned projects</h3>
          <p>Track titles, descriptions, due dates, and completion status in a clean card view.</p>
        </div>

        {studentProjects.length ? (
          <div className="project-grid">
            {studentProjects.map((project) => (
              <article className="project-card" key={project.id}>
                <div className="project-card-top">
                  <strong>{project.title}</strong>
                  <span
                    className={
                      project.status.toLowerCase() === 'done'
                        ? 'status-badge done'
                        : 'status-badge pending'
                    }
                  >
                    {project.status}
                  </span>
                </div>
                <p>{project.description}</p>
                <div className="project-meta">
                  <span>Due date</span>
                  <strong>{formatDate(project.dueDate)}</strong>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No projects assigned yet.</strong>
            <p>Your project cards will appear here when work is assigned to your student account.</p>
          </div>
        )}
      </article>
    </section>
  );

  const renderProfileSection = () => (
    <section className="admin-panel">
      <section className="detail-grid admin-detail-grid">
        <article className="detail-card">
          <div className="section-heading">
            <span className="eyebrow">Profile</span>
            <h3>Your student profile</h3>
            <p>Your personal profile information, kept read-only inside the student workspace.</p>
          </div>

          <div className="compact-list">
            <div className="compact-list-item">
              <div>
                <strong>{student.name}</strong>
                <p>{student.title}</p>
              </div>
              <span className="role-badge student">Student</span>
            </div>
            <div className="compact-list-item">
              <div>
                <strong>Class</strong>
                <p>{classLabel}</p>
              </div>
              <span className="table-note">Enrollment</span>
            </div>
            <div className="compact-list-item">
              <div>
                <strong>Email</strong>
                <p>{student.email}</p>
              </div>
              <span className="table-note">Contact</span>
            </div>
          </div>
        </article>

        <article className="detail-card">
          <div className="section-heading">
            <span className="eyebrow">Class view</span>
            <h3>Current subjects</h3>
            <p>Your assigned classes with teacher and room context for a quick scan.</p>
          </div>

          <div className="compact-list">
            {studentClasses.length ? (
              studentClasses.map((classItem) => (
                <div className="compact-list-item" key={classItem.id}>
                  <div>
                    <strong>
                      {classItem.subject} - {classItem.section}
                    </strong>
                    <p>
                      {classItem.schedule} | {classItem.room}
                    </p>
                  </div>
                  <span className="table-note">
                    {classItem.teacher?.name ?? getTeacherName(classItem.teacherId)}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>No classes assigned yet.</strong>
                <p>Once enrollment data is linked, your active class list will show here.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </section>
  );

  const renderContent = () => {
    if (activeSectionId === 'grades') {
      return renderGradesSection();
    }

    if (activeSectionId === 'schedule') {
      return renderScheduleSection();
    }

    if (activeSectionId === 'projects') {
      return renderProjectsSection();
    }

    if (activeSectionId === 'profile') {
      return renderProfileSection();
    }

    return renderOverviewSection();
  };

  return renderContent();
}

export default StudentPanel;
