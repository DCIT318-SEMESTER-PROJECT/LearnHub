import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // ✅ Saved preference always wins
    const saved = localStorage.getItem('theme');
    if (saved) return saved;

    // ✅ Otherwise default to dark
    return 'dark';
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme', theme);

    // Apply to HTML element
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark-theme');
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
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