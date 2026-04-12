'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { createContext, useContext } from 'react';

const ThemeToggleContext = createContext();

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      themes={['light', 'dark', 'gradient', 'punchy', 'simple-white']}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = require('next-themes').useTheme();
  return {
    theme: resolvedTheme || theme || 'dark',
    setTheme,
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'), // Keep for backward compat
  };
}
