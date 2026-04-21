'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { Palette, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { trackFeatureUsed } from '@/lib/ga';

const themeCategories = [
  {
    name: 'Solid',
    themes: [
      { id: 'light', label: 'Light', swatch: 'bg-[#ffffff] border border-gray-200' },
      { id: 'dark', label: 'Dark', swatch: 'bg-[#0a0a0f]' },
      { id: 'simple-white', label: 'Pure White', swatch: 'bg-[#ffffff]' },
      { id: 'punchy', label: 'Cyberpunk', swatch: 'bg-[#0d0d1a] border border-fuchsia-500/30' },
    ],
  },
  {
    name: 'Gradient',
    themes: [
      {
        id: 'gradient',
        label: 'Cosmic',
        swatch: 'bg-gradient-to-br from-[#1a0a2e] to-[#0d1b3e]',
      },
      {
        id: 'aurora',
        label: 'Aurora',
        swatch: 'bg-gradient-to-br from-[#0d1f22] to-[#1a2f1a]',
      },
      {
        id: 'sunset',
        label: 'Sunset',
        swatch: 'bg-gradient-to-br from-[#1f0d15] to-[#2a1520]',
      },
      {
        id: 'ocean',
        label: 'Ocean',
        swatch: 'bg-gradient-to-br from-[#0a1628] to-[#0d2137]',
      },
    ],
  },
  {
    name: 'Glass',
    themes: [
      {
        id: 'glass-dark',
        label: 'Glass Dark',
        swatch: 'bg-[#12122a] ring-1 ring-white/20',
      },
      {
        id: 'glass-light',
        label: 'Glass Light',
        swatch: 'bg-[#d8d8e4] ring-1 ring-white/40',
      },
      {
        id: 'frosted',
        label: 'Frosted',
        swatch: 'bg-[#0f1a30] ring-1 ring-white/15',
      },
    ],
  },
];

export default function ThemePicker({ side = 'right', align = 'end', isSidebar = false }) {
  const { theme, setTheme } = useTheme();

  const transitionRef = useRef(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionRef.current) clearTimeout(transitionRef.current);
    };
  }, []);

  const handleThemeChange = useCallback(
    (themeId) => {
      const root = document.documentElement;
      root.classList.add('theme-transition');
      setTheme(themeId);
      trackFeatureUsed({ featureName: 'theme_change', context: themeId });
      // Clear any previous timeout so rapid clicks don't remove
      // the transition class mid-animation
      if (transitionRef.current) clearTimeout(transitionRef.current);
      transitionRef.current = setTimeout(() => root.classList.remove('theme-transition'), 350);
    },
    [setTheme]
  );

  if (isSidebar) {
    return (
      <div className="space-y-2">
        <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Theme</div>
        <div className="px-3 space-y-2.5">
          {themeCategories.map((category) => (
            <div key={category.name}>
              <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 mb-1.5">
                {category.name}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {category.themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    title={t.label}
                    className={cn(
                      'group relative rounded-full transition-all duration-200',
                      theme === t.id
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                        : 'hover:scale-105'
                    )}
                  >
                    <div className={cn('h-7 w-7 rounded-full transition-all duration-200', t.swatch)}>
                      {theme === t.id && (
                        <div className="h-full w-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center justify-center rounded-full h-9 w-9 hover:bg-secondary transition-colors outline-none"
          aria-label="Select theme"
        >
          <Palette className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={8}
        className="w-[240px] p-3 rounded-xl border-border/50 shadow-xl backdrop-blur-xl bg-popover/95"
      >
        <div className="space-y-3">
          {themeCategories.map((category, catIdx) => (
            <div key={category.name}>
              <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 mb-2">
                {category.name}
              </div>
              <div className="flex flex-wrap gap-2">
                {category.themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={cn(
                      'group relative flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition-all duration-200 cursor-pointer',
                      theme === t.id ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-secondary/50'
                    )}
                  >
                    <div
                      className={cn(
                        'h-7 w-7 rounded-full transition-all duration-200',
                        t.swatch,
                        theme === t.id
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-popover scale-110'
                          : 'group-hover:scale-105'
                      )}
                    >
                      {theme === t.id && (
                        <div className="h-full w-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight text-center">
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
              {catIdx < themeCategories.length - 1 && <div className="mt-3 h-px bg-border/50" />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
