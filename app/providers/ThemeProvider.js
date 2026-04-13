'use client';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { useState, useEffect } from 'react';

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
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (theme || resolvedTheme || 'dark') : 'dark';

  return {
    theme: currentTheme,
    setTheme,
    toggleTheme: () => setTheme(currentTheme === 'dark' ? 'light' : 'dark'),
  };
}
