import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHomePath } from '../data/roleRoutes';
import { roleOrder } from '../data/demoUsers';
import api, { getApiErrorMessage } from '../lib/api';

const highlights = [
  'Role-based dashboards for administrators, teachers, and students.',
  'A streamlined sidebar and top navigation for everyday school workflows.',
  'JWT-backed login and live school records powered by a real API.',
];

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'Admin',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const demoAccountsQuery = useQuery({
    queryKey: ['auth', 'demo-accounts'],
    queryFn: async () => {
      const response = await api.get('/auth/demo-accounts');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
  const demoAccounts = roleOrder
    .map((role) => demoAccountsQuery.data?.find((candidate) => candidate.role === role))
    .filter(Boolean);

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const useDemoAccount = (account) => {
    setError('');
    setFormData({
      username: account.username,
      password: account.password,
      role: account.role,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(formData);

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    navigate(getRoleHomePath(result.user.role), { replace: true });
  };

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="showcase-badge">Blue Ridge Academy</div>
        <h1>Manage school life through one calm, connected workspace.</h1>
        <p className="showcase-copy">
          Track operations, classes, and student progress from a single experience designed for
          every role on campus.
        </p>

        <div className="highlight-list">
          {highlights.map((highlight) => (
            <article className="highlight-card" key={highlight}>
              <span className="highlight-dot" />
              <p>{highlight}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="section-heading">
            <span className="eyebrow">Welcome back</span>
            <h2>Sign in to your dashboard</h2>
            <p>Select a role and use one of the seeded demo accounts to enter the app.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Username</span>
              <input
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                name="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={updateField}
              />
            </label>

            <label className="field">
              <span>Role</span>
              <select
                disabled={isSubmitting}
                name="role"
                value={formData.role}
                onChange={updateField}
              >
                <option value="Admin">Admin</option>
                <option value="Teacher">Teacher</option>
                <option value="Student">Student</option>
              </select>
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Signing In...' : 'Log In'}
            </button>
          </form>

          <div className="section-heading compact">
            <span className="eyebrow">Demo credentials</span>
            <p>Tap any card to auto-fill the form with backend-seeded credentials.</p>
          </div>

          {demoAccountsQuery.isLoading ? <p className="helper-text">Loading demo accounts...</p> : null}
          {demoAccountsQuery.isError ? (
            <p className="form-error">
              {getApiErrorMessage(
                demoAccountsQuery.error,
                'Unable to load demo credentials right now.',
              )}
            </p>
          ) : null}

          <div className="demo-grid">
            {demoAccounts.map((account) => (
              <button
                className="demo-card"
                disabled={isSubmitting}
                key={account.role}
                type="button"
                onClick={() => useDemoAccount(account)}
              >
                <div className="demo-card-top">
                  <strong>{account.role}</strong>
                  <span>{account.name}</span>
                </div>
                <p>{account.title}</p>
                <div className="demo-credentials">
                  <span>{account.username}</span>
                  <span>{account.password}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
