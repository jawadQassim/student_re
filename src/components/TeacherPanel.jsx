import { useState } from 'react';
import { useSchoolData } from '../context/SchoolDataContext';
import { ConfirmationModal, ModalFrame } from './PanelModals';

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const defaultGradeForm = {
  studentId: '',
  subject: '',
  grade: '',
  date: '',
};

const defaultScheduleForm = {
  day: 'Monday',
  time: '',
  subject: '',
};

function formatDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function sortByDayAndTime(firstEntry, secondEntry) {
  const firstDayIndex = dayOrder.indexOf(firstEntry.day);
  const secondDayIndex = dayOrder.indexOf(secondEntry.day);

  if (firstDayIndex !== secondDayIndex) {
    return firstDayIndex - secondDayIndex;
  }

  return firstEntry.time.localeCompare(secondEntry.time);
}

function getGradeFormValues(initialGrade, presetValues = {}) {
  if (!initialGrade) {
    return {
      ...defaultGradeForm,
      ...presetValues,
      date: presetValues.date ?? new Date().toISOString().slice(0, 10),
    };
  }

  return {
    studentId: initialGrade.studentId,
    subject: initialGrade.subject,
    grade: initialGrade.grade,
    date: initialGrade.date,
  };
}

function getScheduleFormValues(initialEntry) {
  if (!initialEntry) {
    return defaultScheduleForm;
  }

  return {
    day: initialEntry.day,
    time: initialEntry.time,
    subject: initialEntry.subject,
  };
}

function TeacherPanel({ activeSectionId, teacher }) {
  const {
    users,
    classes,
    grades,
    scheduleEntries,
    createGrade,
    updateGrade,
    createScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry,
  } = useSchoolData();
  const [gradeModalState, setGradeModalState] = useState(null);
  const [scheduleModalState, setScheduleModalState] = useState(null);
  const [confirmationState, setConfirmationState] = useState(null);

  const teacherClasses = [...classes]
    .filter((classItem) => classItem.teacherId === teacher.id)
    .sort(
      (firstClass, secondClass) =>
        firstClass.subject.localeCompare(secondClass.subject) ||
        firstClass.section.localeCompare(secondClass.section),
    );
  const assignedStudentIds = Array.from(
    new Set(teacherClasses.flatMap((classItem) => classItem.studentIds ?? [])),
  );
  const assignedStudents = assignedStudentIds
    .map((studentId) => users.find((candidate) => candidate.id === studentId))
    .filter(Boolean)
    .sort((firstStudent, secondStudent) => firstStudent.name.localeCompare(secondStudent.name));
  const teacherGrades = [...grades]
    .filter((grade) => grade.teacherId === teacher.id)
    .sort(
      (firstGrade, secondGrade) =>
        secondGrade.date.localeCompare(firstGrade.date) ||
        getStudentNameFromUsers(users, firstGrade.studentId).localeCompare(
          getStudentNameFromUsers(users, secondGrade.studentId),
        ),
    );
  const teacherSchedule = [...scheduleEntries]
    .filter((entry) => entry.teacherId === teacher.id)
    .sort(sortByDayAndTime);
  const subjectOptions = Array.from(
    new Set(
      [
        ...teacherClasses.map((classItem) => classItem.subject),
        ...teacherSchedule.map((entry) => entry.subject),
      ].filter(Boolean),
    ),
  ).sort((firstSubject, secondSubject) => firstSubject.localeCompare(secondSubject));

  const getStudentSubjects = (studentId) =>
    teacherClasses
      .filter((classItem) => (classItem.studentIds ?? []).includes(studentId))
      .map((classItem) => classItem.subject);

  const getLatestGradeForStudent = (studentId) =>
    teacherGrades.find((grade) => grade.studentId === studentId) ?? null;

  const openCreateGradeModal = (presetValues = {}) => {
    setGradeModalState({
      mode: 'create',
      grade: null,
      presetValues,
    });
  };

  const openEditGradeModal = (grade) => {
    setGradeModalState({
      mode: 'edit',
      grade,
      presetValues: {},
    });
  };

  const openCreateScheduleModal = () => {
    setScheduleModalState({
      mode: 'create',
      entry: null,
    });
  };

  const openEditScheduleModal = (entry) => {
    setScheduleModalState({
      mode: 'edit',
      entry,
    });
  };

  const handleSaveGrade = (formData) => {
    const nextGrade = {
      ...formData,
      teacherId: teacher.id,
    };

    if (gradeModalState?.mode === 'edit' && gradeModalState.grade) {
      updateGrade(gradeModalState.grade.id, nextGrade);
    } else {
      createGrade(nextGrade);
    }

    setGradeModalState(null);
  };

  const handleSaveScheduleEntry = (formData) => {
    const nextEntry = {
      ...formData,
      teacherId: teacher.id,
    };

    if (scheduleModalState?.mode === 'edit' && scheduleModalState.entry) {
      updateScheduleEntry(scheduleModalState.entry.id, nextEntry);
    } else {
      createScheduleEntry(nextEntry);
    }

    setScheduleModalState(null);
  };

  const requestDeleteScheduleEntry = (entry) => {
    setConfirmationState({
      title: 'Delete timetable slot',
      message: `Remove ${entry.subject} from ${entry.day} at ${entry.time}? This change updates the live teacher schedule state immediately.`,
      confirmLabel: 'Delete slot',
      onConfirm: () => {
        deleteScheduleEntry(entry.id);
        setConfirmationState(null);
      },
    });
  };

  const renderOverviewSection = () => (
    <section className="admin-panel">
      <article className="detail-card admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <span className="eyebrow">Overview</span>
            <h3>Teaching workload at a glance</h3>
            <p>See your class load, recent grading activity, and the week ahead from one workspace.</p>
          </div>
          <div className="toolbar-actions">
            <button
              className="primary-button compact"
              type="button"
              onClick={() =>
                openCreateGradeModal({
                  studentId: assignedStudents[0]?.id ?? '',
                  subject: subjectOptions[0] ?? '',
                })
              }
            >
              Add Grade
            </button>
            <button className="ghost-button compact" type="button" onClick={openCreateScheduleModal}>
              Add Timetable Slot
            </button>
          </div>
        </div>

        <div className="overview-grid">
          <article className="mini-card">
            <span>Assigned students</span>
            <strong>{assignedStudents.length}</strong>
            <p>Students currently linked to your classes.</p>
          </article>
          <article className="mini-card">
            <span>Grade entries</span>
            <strong>{teacherGrades.length}</strong>
            <p>Assessment records you can edit anytime.</p>
          </article>
          <article className="mini-card">
            <span>Weekly slots</span>
            <strong>{teacherSchedule.length}</strong>
            <p>Timetable entries in your current schedule.</p>
          </article>
          <article className="mini-card">
            <span>Subjects taught</span>
            <strong>{subjectOptions.length}</strong>
            <p>Subjects tied to your timetable and classes.</p>
          </article>
        </div>
      </article>

      <section className="detail-grid admin-detail-grid">
        <article className="detail-card">
          <div className="section-heading">
            <span className="eyebrow">Student snapshot</span>
            <h3>Your assigned students</h3>
            <p>A fast view of the learners connected to your current classes.</p>
          </div>

          <div className="compact-list">
            {assignedStudents.length ? (
              assignedStudents.slice(0, 5).map((student) => {
                const latestGrade = getLatestGradeForStudent(student.id);

                return (
                  <div className="compact-list-item" key={student.id}>
                    <div>
                      <strong>{student.name}</strong>
                      <p>{getStudentSubjects(student.id).join(', ') || 'No subject linked yet'}</p>
                    </div>
                    <span className="table-note">
                      {latestGrade ? `${latestGrade.grade} in ${latestGrade.subject}` : 'No grades yet'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <strong>No students assigned yet.</strong>
                <p>Assign a teacher to a class with enrolled students to populate this list.</p>
              </div>
            )}
          </div>
        </article>

        <article className="detail-card">
          <div className="section-heading">
            <span className="eyebrow">Weekly timetable</span>
            <h3>Upcoming schedule</h3>
            <p>Your timetable for the week, ordered by day and time.</p>
          </div>

          <div className="compact-list">
            {teacherSchedule.length ? (
              teacherSchedule.slice(0, 5).map((entry) => (
                <div className="compact-list-item" key={entry.id}>
                  <div>
                    <strong>{entry.subject}</strong>
                    <p>
                      {entry.day} | {entry.time}
                    </p>
                  </div>
                  <span className="table-note">Active</span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>No timetable slots yet.</strong>
                <p>Add your weekly teaching blocks to keep this view current.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </section>
  );

  const renderStudentsSection = () => (
    <section className="admin-panel">
      <article className="detail-card admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <span className="eyebrow">Students</span>
            <h3>Assigned students</h3>
            <p>Review who is attached to your classes and jump straight into grading.</p>
          </div>
        </div>

        <div className="table-shell">
          {assignedStudents.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Assigned Subjects</th>
                  <th>Latest Grade</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignedStudents.map((student) => {
                  const latestGrade = getLatestGradeForStudent(student.id);
                  const studentSubjects = getStudentSubjects(student.id);

                  return (
                    <tr key={student.id}>
                      <td>
                        <div className="table-cell-stack">
                          <strong>{student.name}</strong>
                          <span>{student.title}</span>
                        </div>
                      </td>
                      <td>{student.email}</td>
                      <td>{studentSubjects.join(', ') || 'No subject linked yet'}</td>
                      <td>
                        {latestGrade
                          ? `${latestGrade.grade} | ${latestGrade.subject} | ${formatDate(latestGrade.date)}`
                          : 'No grades yet'}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="row-button"
                            type="button"
                            onClick={() =>
                              openCreateGradeModal({
                                studentId: student.id,
                                subject: studentSubjects[0] ?? subjectOptions[0] ?? '',
                              })
                            }
                          >
                            Add Grade
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <strong>No students assigned yet.</strong>
              <p>Once a class is assigned to you and includes students, they will appear here.</p>
            </div>
          )}
        </div>
      </article>
    </section>
  );

  const renderGradesSection = () => (
    <section className="admin-panel">
      <article className="detail-card admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <span className="eyebrow">Grades</span>
            <h3>Gradebook</h3>
            <p>Add fresh marks or update an existing grade entry for any assigned student.</p>
          </div>
          <button
            className="primary-button compact"
            type="button"
            onClick={() =>
              openCreateGradeModal({
                studentId: assignedStudents[0]?.id ?? '',
                subject: subjectOptions[0] ?? '',
              })
            }
          >
            Add Grade
          </button>
        </div>

        <div className="table-shell">
          {teacherGrades.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Grade</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teacherGrades.map((grade) => (
                  <tr key={grade.id}>
                    <td>{getStudentNameFromUsers(users, grade.studentId)}</td>
                    <td>{grade.subject}</td>
                    <td>{grade.grade}</td>
                    <td>{formatDate(grade.date)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="row-button"
                          type="button"
                          onClick={() => openEditGradeModal(grade)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <strong>No grade entries yet.</strong>
              <p>Add your first grade to start the teacher gradebook.</p>
            </div>
          )}
        </div>
      </article>
    </section>
  );

  const renderScheduleSection = () => (
    <section className="admin-panel">
      <article className="detail-card admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <span className="eyebrow">Schedule</span>
            <h3>Weekly timetable</h3>
            <p>Build and maintain the weekly teaching schedule with day, time, and subject blocks.</p>
          </div>
          <button className="primary-button compact" type="button" onClick={openCreateScheduleModal}>
            Add Timetable Slot
          </button>
        </div>

        <div className="table-shell">
          {teacherSchedule.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teacherSchedule.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.day}</td>
                    <td>{entry.time}</td>
                    <td>{entry.subject}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="row-button"
                          type="button"
                          onClick={() => openEditScheduleModal(entry)}
                        >
                          Edit
                        </button>
                        <button
                          className="row-button danger"
                          type="button"
                          onClick={() => requestDeleteScheduleEntry(entry)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <strong>No timetable entries yet.</strong>
              <p>Add day and time blocks to start shaping the weekly teaching plan.</p>
            </div>
          )}
        </div>
      </article>
    </section>
  );

  const renderProfileSection = () => (
    <section className="admin-panel">
      <section className="detail-grid admin-detail-grid">
        <article className="detail-card">
          <div className="section-heading">
            <span className="eyebrow">Profile</span>
            <h3>Your teacher profile</h3>
            <p>Reference your account details and teaching footprint at a glance.</p>
          </div>

          <div className="compact-list">
            <div className="compact-list-item">
              <div>
                <strong>{teacher.name}</strong>
                <p>{teacher.title}</p>
              </div>
              <span className="role-badge teacher">Teacher</span>
            </div>
            <div className="compact-list-item">
              <div>
                <strong>Email</strong>
                <p>{teacher.email}</p>
              </div>
              <span className="table-note">Contact</span>
            </div>
            <div className="compact-list-item">
              <div>
                <strong>Username</strong>
                <p>{teacher.username}</p>
              </div>
              <span className="table-note">Login</span>
            </div>
            <div className="compact-list-item">
              <div>
                <strong>Teaching load</strong>
                <p>
                  {teacherClasses.length} classes | {assignedStudents.length} students
                </p>
              </div>
              <span className="table-note">{teacherGrades.length} grades logged</span>
            </div>
          </div>
        </article>

        <article className="detail-card">
          <div className="section-heading">
            <span className="eyebrow">Classes</span>
            <h3>Your assigned subjects</h3>
            <p>Current classes linked to your account from the school administration panel.</p>
          </div>

          <div className="compact-list">
            {teacherClasses.length ? (
              teacherClasses.map((classItem) => (
                <div className="compact-list-item" key={classItem.id}>
                  <div>
                    <strong>
                      {classItem.subject} - {classItem.section}
                    </strong>
                    <p>
                      {classItem.code} | {classItem.room} | {classItem.schedule}
                    </p>
                  </div>
                  <span className="table-note">
                    {(classItem.studentIds ?? []).length} students
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>No classes assigned yet.</strong>
                <p>Once an admin assigns you to a class, it will appear here automatically.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </section>
  );

  const renderContent = () => {
    if (activeSectionId === 'students') {
      return renderStudentsSection();
    }

    if (activeSectionId === 'grades') {
      return renderGradesSection();
    }

    if (activeSectionId === 'schedule') {
      return renderScheduleSection();
    }

    if (activeSectionId === 'profile') {
      return renderProfileSection();
    }

    return renderOverviewSection();
  };

  return (
    <>
      {renderContent()}

      {gradeModalState ? (
        <GradeModal
          eyebrow="Teacher action"
          initialGrade={gradeModalState.grade}
          mode={gradeModalState.mode}
          presetValues={gradeModalState.presetValues}
          students={assignedStudents}
          subjectOptions={subjectOptions}
          onClose={() => setGradeModalState(null)}
          onSubmit={handleSaveGrade}
        />
      ) : null}

      {scheduleModalState ? (
        <ScheduleModal
          eyebrow="Teacher action"
          initialEntry={scheduleModalState.entry}
          mode={scheduleModalState.mode}
          scheduleEntries={teacherSchedule}
          onClose={() => setScheduleModalState(null)}
          onSubmit={handleSaveScheduleEntry}
        />
      ) : null}

      {confirmationState ? (
        <ConfirmationModal
          confirmLabel={confirmationState.confirmLabel}
          eyebrow="Teacher action"
          message={confirmationState.message}
          title={confirmationState.title}
          onClose={() => setConfirmationState(null)}
          onConfirm={confirmationState.onConfirm}
        />
      ) : null}
    </>
  );
}

function GradeModal({
  eyebrow,
  initialGrade,
  mode,
  onClose,
  onSubmit,
  presetValues,
  students,
  subjectOptions,
}) {
  const [formData, setFormData] = useState(getGradeFormValues(initialGrade, presetValues));
  const [error, setError] = useState('');

  const updateField = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextGrade = {
      studentId: formData.studentId,
      subject: formData.subject.trim(),
      grade: formData.grade.trim(),
      date: formData.date,
    };

    if (!nextGrade.studentId || !nextGrade.subject || !nextGrade.grade || !nextGrade.date) {
      setError('Select a student and complete the subject, grade, and date fields.');
      return;
    }

    onSubmit(nextGrade);
  };

  return (
    <ModalFrame
      eyebrow={eyebrow}
      onClose={onClose}
      subtitle="Record or revise a grade entry for one of your assigned students."
      title={mode === 'edit' ? 'Edit grade' : 'Add grade'}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-grid">
          <label className="field">
            <span>Student</span>
            <select name="studentId" value={formData.studentId} onChange={updateField}>
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Subject</span>
            <input
              name="subject"
              type="text"
              list="teacher-subject-options"
              placeholder={subjectOptions[0] ?? 'Enter subject'}
              value={formData.subject}
              onChange={updateField}
            />
            <datalist id="teacher-subject-options">
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject} />
              ))}
            </datalist>
          </label>

          <label className="field">
            <span>Grade</span>
            <input
              name="grade"
              type="text"
              placeholder="A, 92, or Pass"
              value={formData.grade}
              onChange={updateField}
            />
          </label>

          <label className="field">
            <span>Date</span>
            <input name="date" type="date" value={formData.date} onChange={updateField} />
          </label>
        </div>

        {students.length ? null : (
          <p className="helper-text">
            No students are currently assigned to your classes. Once students are linked to your classes, you can record grades here.
          </p>
        )}

        {error ? <p className="form-error">{error}</p> : null}

        <div className="modal-actions">
          <button className="ghost-button compact" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button compact" type="submit">
            {mode === 'edit' ? 'Save Grade' : 'Add Grade'}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function ScheduleModal({ eyebrow, initialEntry, mode, onClose, onSubmit, scheduleEntries }) {
  const [formData, setFormData] = useState(getScheduleFormValues(initialEntry));
  const [error, setError] = useState('');

  const updateField = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextEntry = {
      day: formData.day,
      time: formData.time.trim(),
      subject: formData.subject.trim(),
    };

    if (!nextEntry.day || !nextEntry.time || !nextEntry.subject) {
      setError('Complete the day, time, and subject fields before saving this slot.');
      return;
    }

    const duplicateSlot = scheduleEntries.some(
      (entry) =>
        entry.id !== initialEntry?.id &&
        entry.day === nextEntry.day &&
        entry.time.toLowerCase() === nextEntry.time.toLowerCase(),
    );

    if (duplicateSlot) {
      setError('A timetable slot already exists for that day and time.');
      return;
    }

    onSubmit(nextEntry);
  };

  return (
    <ModalFrame
      eyebrow={eyebrow}
      onClose={onClose}
      subtitle="Create or revise a weekly teaching block for your personal timetable."
      title={mode === 'edit' ? 'Edit timetable slot' : 'Add timetable slot'}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-grid">
          <label className="field">
            <span>Day</span>
            <select name="day" value={formData.day} onChange={updateField}>
              {dayOrder.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Time</span>
            <input
              name="time"
              type="text"
              placeholder="08:15 AM - 09:00 AM"
              value={formData.time}
              onChange={updateField}
            />
          </label>

          <label className="field">
            <span>Subject</span>
            <input
              name="subject"
              type="text"
              placeholder="Enter subject"
              value={formData.subject}
              onChange={updateField}
            />
          </label>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="modal-actions">
          <button className="ghost-button compact" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button compact" type="submit">
            {mode === 'edit' ? 'Save Slot' : 'Add Slot'}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function getStudentNameFromUsers(users, studentId) {
  return users.find((candidate) => candidate.id === studentId)?.name ?? 'Unknown Student';
}

export default TeacherPanel;
