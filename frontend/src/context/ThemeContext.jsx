import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Saved preference always wins
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;

    // Otherwise default to dark
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;

    // Apply attributes/classes
    root.setAttribute('data-theme', theme);
    root.classList.toggle('dark-theme', theme === 'dark');

    // Tell the browser to use dark scrollbars, form controls, etc.
    root.style.colorScheme = theme;

    // Force the root background so there's never a mismatched edge
    root.style.background = theme === 'dark' ? '#0d0d1a' : '#ffffff';

    // Persist
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}