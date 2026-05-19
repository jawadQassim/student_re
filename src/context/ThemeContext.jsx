import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = 'school-management-theme';

function getStoredTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) ?? 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDarkMode: theme === 'dark',
      toggleTheme: () => {
        setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
