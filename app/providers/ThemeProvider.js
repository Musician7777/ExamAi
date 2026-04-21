'use client';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { useState, useEffect } from 'react';

const THEMES = [
  'light',
  'dark',
  'simple-white',
  'punchy',
  'gradient',
  'aurora',
  'sunset',
  'ocean',
  'glass-dark',
  'glass-light',
  'frosted',
];

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      themes={THEMES}
      storageKey="examai-theme"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  useEffect(() => {
    // Hydration guard — must start false to prevent SSR/client mismatch
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  // Get the current theme safely after mount
  const currentTheme = mounted ? theme || resolvedTheme || 'dark' : undefined;

  return {
    theme: currentTheme,
    themes: THEMES,
    setTheme,
    toggleTheme: () => {
      const next = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(next);
    },
  };
}
