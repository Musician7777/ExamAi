'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '../../providers/ThemeProvider';
import { Sun, Moon, Menu, X, LogOut, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function Navbar() {
    const { theme, setTheme } = useTheme();
    const { data: session, status } = useSession();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <>
            <nav className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                scrolled
                    ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-sm"
                    : "bg-transparent"
            )}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                        <img src="/Logo.png" alt="ExamAI" className="h-12 w-auto" style={{ mixBlendMode: 'screen' }} />
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                        <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
                        <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
                        {session && <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Select theme" className="rounded-full">
                                    <Palette className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme('punchy')}>Cyberpunk</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme('gradient')}>Cosmic</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme('simple-white')}>Minimal White</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {status === 'loading' ? (
                            <div className="w-20 h-8 rounded-md bg-muted animate-pulse" />
                        ) : session ? (
                            <>
                                <Link href="/dashboard" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={session.user?.image} />
                                        <AvatarFallback className="text-[10px]">{getInitials(session.user?.name)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{session.user?.name?.split(' ')[0]}</span>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    aria-label="Sign out"
                                    className="hidden sm:flex rounded-full"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="hidden sm:inline-flex">
                                    <Button variant="ghost" size="sm">Log in</Button>
                                </Link>
                                <Link href="/register" className="hidden sm:inline-flex">
                                    <Button variant="brand" size="sm">Get Started</Button>
                                </Link>
                            </>
                        )}

                        {/* Mobile menu button */}
                        <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setMobileOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-72 bg-background border-l border-border p-6 flex flex-col gap-4 animate-in slide-in-from-right">
                        <Button variant="ghost" size="icon" className="self-end rounded-full" onClick={() => setMobileOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                        <Link href="/#features" className="text-sm py-2 hover:text-foreground text-muted-foreground transition-colors" onClick={() => setMobileOpen(false)}>Features</Link>
                        <Link href="/#how-it-works" className="text-sm py-2 hover:text-foreground text-muted-foreground transition-colors" onClick={() => setMobileOpen(false)}>How It Works</Link>
                        <Link href="/#pricing" className="text-sm py-2 hover:text-foreground text-muted-foreground transition-colors" onClick={() => setMobileOpen(false)}>Pricing</Link>
                        {session ? (
                            <>
                                <Link href="/dashboard" className="text-sm py-2 hover:text-foreground text-muted-foreground transition-colors" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                                <Button variant="outline" onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }}>Sign Out</Button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" onClick={() => setMobileOpen(false)}><Button variant="outline" className="w-full">Log in</Button></Link>
                                <Link href="/register" onClick={() => setMobileOpen(false)}><Button variant="brand" className="w-full">Get Started</Button></Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
