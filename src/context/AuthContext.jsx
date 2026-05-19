import { createContext, useContext, useEffect, useState } from 'react';
import { useSchoolData } from './SchoolDataContext';

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = 'school-management-active-user';

function getStoredUserId() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const { users } = useSchoolData();
  const [activeUserId, setActiveUserId] = useState(getStoredUserId);
  const user = users.find((candidate) => candidate.id === activeUserId) ?? null;

  useEffect(() => {
    if (!activeUserId) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    if (!user) {
      setActiveUserId(null);
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, activeUserId);
  }, [activeUserId, user]);

  const login = ({ username, password, role }) => {
    const normalizedUsername = username.trim().toLowerCase();
    const account = users.find(
      (candidate) =>
        candidate.role === role &&
        candidate.username.toLowerCase() === normalizedUsername &&
        candidate.password === password,
    );

    if (!account) {
      return {
        success: false,
        error: 'Credentials do not match the selected role. Try one of the demo accounts below.',
      };
    }

    setActiveUserId(account.id);
    return {
      success: true,
      user: account,
    };
  };

  const logout = () => {
    setActiveUserId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        activeUserId,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
