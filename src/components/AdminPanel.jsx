import { useState } from 'react';
import { useSchoolData } from '../context/SchoolDataContext';
import { ConfirmationModal, ModalFrame } from './PanelModals';

const defaultUserForm = {
  role: 'Student',
  name: '',
  email: '',
  username: '',
  password: '',
  title: '',
};

const defaultClassForm = {
  subject: '',
  code: '',
  section: '',
  teacherId: '',
  room: '',
  schedule: '',
};

function getRoleRank(role) {
  if (role === 'Admin') {
    return 0;
  }

  if (role === 'Teacher') {
    return 1;
  }

  return 2;
}

function getUserFormValues(user) {
  if (!user) {
    return defaultUserForm;
  }

  return {
    role: user.role,
    name: user.name,
    email: user.email,
    username: user.username,
    password: user.password,
    title: user.title,
  };
}

function getClassFormValues(classItem) {
  if (!classItem) {
    return defaultClassForm;
  }

  return {
    subject: classItem.subject,
    code: classItem.code,
    section: classItem.section,
    teacherId: classItem.teacherId,
    room: classItem.room,
    schedule: classItem.schedule,
  };
}

function AdminPanel({ activeSectionId }) {
  const { users, classes, createUser, updateUser, deleteUser, createClass, updateClass, deleteClass } =
    useSchoolData();
  const [userModalState, setUserModalState] = useState(null);
  const [classModalState, setClassModalState] = useState(null);
  const [confirmationState, setConfirmationState] = useState(null);

  const managedUsers = [...users]
    .filter((candidate) => candidate.role !== 'Admin')
    .sort(
      (firstUser, secondUser) =>
        getRoleRank(firstUser.role) - getRoleRank(secondUser.role) ||
        firstUser.name.localeCompare(secondUser.name),
    );
  const directoryUsers = [...users].sort(
    (firstUser, secondUser) =>
      getRoleRank(firstUser.role) - getRoleRank(secondUser.role) ||
      firstUser.name.localeCompare(secondUser.name),
  );
  const teachers = [...users]
    .filter((candidate) => candidate.role === 'Teacher')
    .sort((firstUser, secondUser) => firstUser.name.localeCompare(secondUser.name));
  const sortedClasses = [...classes].sort(
    (firstClass, secondClass) =>
      firstClass.subject.localeCompare(secondClass.subject) ||
      firstClass.section.localeCompare(secondClass.section),
  );

  const getTeacherName = (teacherId) =>
    teachers.find((teacher) => teacher.id === teacherId)?.name ?? 'Unassigned';

  const openCreateUserModal = () => {
    setUserModalState({
      mode: 'create',
      user: null,
    });
  };

  const openEditUserModal = (account) => {
    setUserModalState({
      mode: 'edit',
      user: account,
    });
  };

  const openCreateClassModal = () => {
    setClassModalState({
      mode: 'create',
      classItem: null,
    });
  };

  const openEditClassModal = (classItem) => {
    setClassModalState({
      mode: 'edit',
      classItem,
    });
  };

  const handleSaveUser = async (formData) => {
    if (userModalState?.mode === 'edit' && userModalState.user) {
      await updateUser(userModalState.user.id, formData);
    } else {
      await createUser(formData);
    }

    setUserModalState(null);
  };

  const handleSaveClass = async (formData) => {
    if (classModalState?.mode === 'edit' && classModalState.classItem) {
      await updateClass(classModalState.classItem.id, formData);
    } else {
      await createClass(formData);
    }

    setClassModalState(null);
  };

  const requestDeleteUser = (account) => {
    const message =
      account.role === 'Teacher'
        ? `Delete ${account.name}'s account? Any classes, grades, and timetable entries tied to this teacher will be updated in the database.`
        : `Delete ${account.name}'s account? Their grade records and class roster assignments will be removed from the database.`;

    setConfirmationState({
      title: 'Delete account',
      message,
      confirmLabel: 'Delete account',
      onConfirm: async () => {
        await deleteUser(account.id);
        setConfirmationState(null);
      },
    });
  };

  const requestDeleteClass = (classItem) => {
    setConfirmationState({
      title: 'Delete class',
      message: `Delete ${classItem.subject} (${classItem.code})? This action removes the class from the live database.`,
      confirmLabel: 'Delete class',
      onConfirm: async () => {
        await deleteClass(classItem.id);
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
            <h3>School administration at a glance</h3>
            <p>Use the sidebar to manage live records, or jump in with a quick action below.</p>
          </div>
          <div className="toolbar-actions">
            <button className="primary-button compact" type="button" onClick={openCreateUserModal}>
              Create Account
            </button>
            <button className="ghost-button compact" type="button" onClick={openCreateClassModal}>
              Add Class
            </button>
          </div>
        </div>

        <div className="overview-grid">
          <article className="mini-card">
            <span>Managed accounts</span>
            <strong>{managedUsers.length}</strong>
            <p>Student and teacher records ready to edit.</p>
          </article>
          <article className="mini-card">
            <span>Directory entries</span>
            <strong>{directoryUsers.length}</strong>
            <p>All users listed with role, name, and email.</p>
          </article>
          <article className="mini-card">
            <span>Active classes</span>
            <strong>{sortedClasses.length}</strong>
            <p>Subjects and sections currently tracked.</p>
          </article>
          <article className="mini-card">
            <span>Unassigned teaching load</span>
            <strong>{sortedClasses.filter((classItem) => !classItem.teacherId).length}</strong>
            <p>Classes that still need a teacher owner.</p>
          </article>
        </div>
      </article>

      <section className="detail-grid admin-detail-grid">
        <article className="detail-card">
          <div className="section-heading">
            <span className="eyebrow">Directory preview</span>
            <h3>Current users</h3>
            <p>A quick view of the live user directory synced from the backend.</p>
          </div>

          <div className="compact-list">
            {directoryUsers.slice(0, 5).map((account) => (
              <div className="compact-list-item" key={account.id}>
                <div>
                  <strong>{account.name}</strong>
                  <p>{account.email}</p>
                </div>
                <span className={`role-badge ${account.role.toLowerCase()}`}>{account.role}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="detail-card">
          <div className="section-heading">
            <span className="eyebrow">Class snapshot</span>
            <h3>Subjects in rotation</h3>
            <p>See which classes are staffed and which still need assignment.</p>
          </div>

          <div className="compact-list">
            {sortedClasses.slice(0, 5).map((classItem) => (
              <div className="compact-list-item" key={classItem.id}>
                <div>
                  <strong>
                    {classItem.subject} - {classItem.section}
                  </strong>
                  <p>
                    {classItem.code} | {getTeacherName(classItem.teacherId)}
                  </p>
                </div>
                <span className="table-note">{classItem.room}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );

  const renderAccountsSection = () => (
    <section className="admin-panel">
      <article className="detail-card admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <span className="eyebrow">Accounts</span>
            <h3>Student and teacher accounts</h3>
            <p>Create, update, and remove student or teacher profiles from one place.</p>
          </div>
          <button className="primary-button compact" type="button" onClick={openCreateUserModal}>
            Create Account
          </button>
        </div>

        <div className="table-shell">
          {managedUsers.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {managedUsers.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <div className="table-cell-stack">
                        <strong>{account.name}</strong>
                        <span>{account.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${account.role.toLowerCase()}`}>{account.role}</span>
                    </td>
                    <td>{account.email}</td>
                    <td>{account.username}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="row-button"
                          type="button"
                          onClick={() => openEditUserModal(account)}
                        >
                          Edit
                        </button>
                        <button
                          className="row-button danger"
                          type="button"
                          onClick={() => requestDeleteUser(account)}
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
              <strong>No managed accounts yet.</strong>
              <p>Create a student or teacher account to populate this table.</p>
            </div>
          )}
        </div>
      </article>
    </section>
  );

  const renderClassesSection = () => (
    <section className="admin-panel">
      <article className="detail-card admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <span className="eyebrow">Classes</span>
            <h3>Classes and subjects</h3>
            <p>Create sections, assign teachers, and keep room and schedule details current.</p>
          </div>
          <button className="primary-button compact" type="button" onClick={openCreateClassModal}>
            Add Class
          </button>
        </div>

        <div className="table-shell">
          {sortedClasses.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Teacher</th>
                  <th>Schedule</th>
                  <th>Room</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedClasses.map((classItem) => (
                  <tr key={classItem.id}>
                    <td>
                      <div className="table-cell-stack">
                        <strong>{classItem.subject}</strong>
                        <span>{classItem.section}</span>
                      </div>
                    </td>
                    <td>{classItem.code}</td>
                    <td>{getTeacherName(classItem.teacherId)}</td>
                    <td>{classItem.schedule}</td>
                    <td>{classItem.room}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="row-button"
                          type="button"
                          onClick={() => openEditClassModal(classItem)}
                        >
                          Edit
                        </button>
                        <button
                          className="row-button danger"
                          type="button"
                          onClick={() => requestDeleteClass(classItem)}
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
              <strong>No classes yet.</strong>
              <p>Add a class or subject to start building the school timetable.</p>
            </div>
          )}
        </div>
      </article>
    </section>
  );

  const renderDirectorySection = () => (
    <section className="admin-panel">
      <article className="detail-card admin-card">
        <div className="section-heading">
          <span className="eyebrow">Directory</span>
          <h3>All users</h3>
          <p>Every account in the app, grouped by role and shown with the contact email on file.</p>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {directoryUsers.map((account) => (
                <tr key={account.id}>
                  <td>
                    <span className={`role-badge ${account.role.toLowerCase()}`}>{account.role}</span>
                  </td>
                  <td>
                    <div className="table-cell-stack">
                      <strong>{account.name}</strong>
                      <span>{account.title}</span>
                    </div>
                  </td>
                  <td>{account.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );

  const renderContent = () => {
    if (activeSectionId === 'accounts') {
      return renderAccountsSection();
    }

    if (activeSectionId === 'classes') {
      return renderClassesSection();
    }

    if (activeSectionId === 'directory') {
      return renderDirectorySection();
    }

    return renderOverviewSection();
  };

  return (
    <>
      {renderContent()}

      {userModalState ? (
        <UserModal
          initialUser={userModalState.user}
          mode={userModalState.mode}
          users={users}
          eyebrow="Admin action"
          onClose={() => setUserModalState(null)}
          onSubmit={handleSaveUser}
        />
      ) : null}

      {classModalState ? (
        <ClassModal
          classes={classes}
          initialClass={classModalState.classItem}
          mode={classModalState.mode}
          teachers={teachers}
          eyebrow="Admin action"
          onClose={() => setClassModalState(null)}
          onSubmit={handleSaveClass}
        />
      ) : null}

      {confirmationState ? (
        <ConfirmationModal
          confirmLabel={confirmationState.confirmLabel}
          eyebrow="Admin action"
          message={confirmationState.message}
          title={confirmationState.title}
          onClose={() => setConfirmationState(null)}
          onConfirm={confirmationState.onConfirm}
        />
      ) : null}
    </>
  );
}

function UserModal({ eyebrow, initialUser, mode, onClose, onSubmit, users }) {
  const [formData, setFormData] = useState(getUserFormValues(initialUser));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextUser = {
      role: formData.role,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      username: formData.username.trim(),
      password: formData.password.trim(),
      title: formData.title.trim(),
    };

    if (Object.values(nextUser).some((value) => !value)) {
      setError('Complete every field before saving this account.');
      return;
    }

    const usernameTaken = users.some(
      (account) =>
        account.id !== initialUser?.id &&
        account.username.toLowerCase() === nextUser.username.toLowerCase(),
    );
    const emailTaken = users.some(
      (account) => account.id !== initialUser?.id && account.email.toLowerCase() === nextUser.email,
    );

    if (usernameTaken) {
      setError('That username is already in use.');
      return;
    }

    if (emailTaken) {
      setError('That email address is already in use.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(nextUser);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalFrame
      eyebrow={eyebrow}
      onClose={onClose}
      subtitle="Create or update a student or teacher account. Changes are saved immediately to the backend and reflected across the dashboard."
      title={mode === 'edit' ? 'Edit account' : 'Create account'}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-grid">
          <label className="field">
            <span>Role</span>
            <select name="role" value={formData.role} onChange={updateField}>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
            </select>
          </label>

          <label className="field">
            <span>Full name</span>
            <input
              name="name"
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={updateField}
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              placeholder="name@blueridgeacademy.edu"
              value={formData.email}
              onChange={updateField}
            />
          </label>

          <label className="field">
            <span>Username</span>
            <input
              name="username"
              type="text"
              placeholder="Enter username"
              value={formData.username}
              onChange={updateField}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="text"
              placeholder="Enter password"
              value={formData.password}
              onChange={updateField}
            />
          </label>

          <label className="field">
            <span>Title or grade</span>
            <input
              name="title"
              type="text"
              placeholder={formData.role === 'Teacher' ? 'Mathematics Teacher' : 'Grade 11 Student'}
              value={formData.title}
              onChange={updateField}
            />
          </label>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="modal-actions">
          <button className="ghost-button compact" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button compact" disabled={isSubmitting} type="submit">
            {mode === 'edit' ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function ClassModal({ classes, eyebrow, initialClass, mode, onClose, onSubmit, teachers }) {
  const [formData, setFormData] = useState(getClassFormValues(initialClass));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextClass = {
      subject: formData.subject.trim(),
      code: formData.code.trim(),
      section: formData.section.trim(),
      teacherId: formData.teacherId,
      room: formData.room.trim(),
      schedule: formData.schedule.trim(),
    };

    if (
      !nextClass.subject ||
      !nextClass.code ||
      !nextClass.section ||
      !nextClass.room ||
      !nextClass.schedule
    ) {
      setError('Complete the subject, code, section, room, and schedule fields before saving.');
      return;
    }

    const codeTaken = classes.some(
      (classItem) =>
        classItem.id !== initialClass?.id && classItem.code.toLowerCase() === nextClass.code.toLowerCase(),
    );

    if (codeTaken) {
      setError('That class code is already in use.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(nextClass);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalFrame
      eyebrow={eyebrow}
      onClose={onClose}
      subtitle="Manage subject details, staffing, and scheduling for each class section."
      title={mode === 'edit' ? 'Edit class' : 'Create class'}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-grid">
          <label className="field">
            <span>Subject</span>
            <input
              name="subject"
              type="text"
              placeholder="Enter subject name"
              value={formData.subject}
              onChange={updateField}
            />
          </label>

          <label className="field">
            <span>Class code</span>
            <input
              name="code"
              type="text"
              placeholder="MTH-201"
              value={formData.code}
              onChange={updateField}
            />
          </label>

          <label className="field">
            <span>Section</span>
            <input
              name="section"
              type="text"
              placeholder="Grade 10 A"
              value={formData.section}
              onChange={updateField}
            />
          </label>

          <label className="field">
            <span>Teacher</span>
            <select name="teacherId" value={formData.teacherId} onChange={updateField}>
              <option value="">Unassigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Room</span>
            <input
              name="room"
              type="text"
              placeholder="Room 302"
              value={formData.room}
              onChange={updateField}
            />
          </label>

          <label className="field">
            <span>Schedule</span>
            <input
              name="schedule"
              type="text"
              placeholder="Mon/Wed | 10:00 AM"
              value={formData.schedule}
              onChange={updateField}
            />
          </label>
        </div>

        {teachers.length ? null : (
          <p className="helper-text">
            No teacher accounts are available yet. You can save this class as unassigned and connect a teacher later.
          </p>
        )}

        {error ? <p className="form-error">{error}</p> : null}

        <div className="modal-actions">
          <button className="ghost-button compact" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button compact" disabled={isSubmitting} type="submit">
            {mode === 'edit' ? 'Save Changes' : 'Create Class'}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

export default AdminPanel;
