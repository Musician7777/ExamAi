'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '../providers/ThemeProvider';
import {
  Home,
  Zap,
  Upload,
  Code,
  MessageSquare,
  BarChart3,
  Menu,
  ClipboardList,
  Star,
  Sun,
  Moon,
  LogOut,
  Palette,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import StudyAssistant from '../components/StudyAssistant/StudyAssistant';
import { NotificationProvider, useNotification } from '../components/BadgeNotification/BadgeNotification';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';
import { cn } from '@/lib/utils';

const navItems = [
  {
    section: 'Main',
    items: [
      { href: '/dashboard', icon: Home, label: 'Dashboard' },
      { href: '/dashboard/generate', icon: Zap, label: 'Generate Exam' },
      { href: '/dashboard/upload', icon: Upload, label: 'Upload Pattern' },
    ],
  },
  {
    section: 'Assessment',
    items: [
      { href: '/dashboard/coding', icon: Code, label: 'Coding Test' },
      { href: '/dashboard/interview', icon: MessageSquare, label: 'Interview Sim' },
      { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    section: 'Progress',
    items: [
      { href: '/dashboard/activity', icon: ClipboardList, label: 'Activity History' },
      { href: '/dashboard/leaderboard', icon: Star, label: 'Leaderboard' },
    ],
  },
  {
    section: 'Account',
    items: [{ href: '/dashboard/profile', icon: UserCircle, label: 'Profile & Settings' }],
  },
];

export default function DashboardLayout({ children }) {
  return (
    <NotificationProvider>
      <DashboardInner>{children}</DashboardInner>
    </NotificationProvider>
  );
}

function DashboardInner({ children }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { notify } = useNotification();

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 px-5 py-4 font-bold text-lg" aria-label="ExamAI Home">
          <img src="/Logo.png" alt="ExamAI Logo" className="h-12 w-auto" style={{ mixBlendMode: 'screen' }} />
        </Link>

        <Separator />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navItems.map((section) => (
            <div key={section.section}>
              <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.section}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Settings
            </div>
            <div className="space-y-0.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full cursor-pointer outline-none">
                    <Palette className="h-4 w-4" />
                    Theme: {theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : 'Dark'}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('punchy')}>Cyberpunk</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('gradient')}>Cosmic</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('simple-white')}>Minimal White</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full cursor-pointer"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        <Separator />

        {/* User card */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={session?.user?.image} />
              <AvatarFallback className="text-xs">{getInitials(session?.user?.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{session?.user?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground truncate">{session?.user?.email || ''}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main id="main-content" className="flex-1 overflow-y-auto p-6 md:p-8" tabIndex={-1}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      <StudyAssistant notify={notify} />
    </div>
  );
}
