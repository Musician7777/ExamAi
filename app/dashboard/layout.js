'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import ThemePicker from '../components/ThemePicker/ThemePicker';
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
  LogOut,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import StudyAssistant from '../components/StudyAssistant/StudyAssistant';
import { NotificationProvider, useNotification } from '../components/BadgeNotification/BadgeNotification';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';
import AdBanner from '../components/AdBanner/AdBanner';
import { cn } from '@/lib/utils';
import { ensureCSRFToken } from '@/lib/client-csrf';

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
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { notify } = useNotification();

  // Ensure CSRF cookie is set on first dashboard load so that
  // mutation requests can include the x-csrf-token header.
  useEffect(() => {
    ensureCSRFToken();
  }, []);

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
          <Image
            src="/Logo.png"
            alt="ExamAI Logo"
            width={48}
            height={48}
            className="h-12 w-auto"
            style={{ mixBlendMode: 'screen' }}
            sizes="48px"
            priority
          />
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

          <ThemePicker isSidebar />

          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Account
            </div>
            <div className="space-y-0.5">
              <Link
                href="/dashboard/profile"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  pathname === '/dashboard/profile'
                    ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <UserCircle className="h-4 w-4" />
                Profile & Settings
              </Link>
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

        {/* Sidebar ad — only shows when slot is configured */}
        <div className="px-3 pb-3 mt-auto">
          <AdBanner
            slot={process.env.NEXT_PUBLIC_AD_SLOT_SIDEBAR || ''}
            format="auto"
            className="w-full"
            style={{ minHeight: '90px' }}
          />
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
