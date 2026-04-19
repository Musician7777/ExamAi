'use client';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      themes={[
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
      ]}
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
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- hydration guard, must start false
  }, []);

  const currentTheme = mounted ? theme || resolvedTheme || 'dark' : 'dark';

  return {
    theme: currentTheme,
    setTheme,
    toggleTheme: () => setTheme(currentTheme === 'dark' ? 'light' : 'dark'),
  };
}
