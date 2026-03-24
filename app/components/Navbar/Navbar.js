'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '../../providers/ThemeProvider';
import { HiOutlineSun, HiOutlineMoon, HiOutlineMenu, HiOutlineX, HiOutlineLogout } from 'react-icons/hi';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
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
            <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
                <div className={styles.navInner}>
                    <Link href="/" className={styles.logo}>
                        <span className={styles.logoIcon}>E</span>
                        <span>Exam<span className="gradient-text">AI</span></span>
                    </Link>

                    <div className={styles.navLinks}>
                        <Link href="/#features" className={styles.navLink}>Features</Link>
                        <Link href="/#how-it-works" className={styles.navLink}>How It Works</Link>
                        <Link href="/#pricing" className={styles.navLink}>Pricing</Link>
                        {session && <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>}
                    </div>

                    <div className={styles.navActions}>
                        <button className={styles.themeBtn} onClick={toggleTheme} aria-label="Toggle theme">
                            {theme === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
                        </button>
                        {status === 'loading' ? (
                            <div className={styles.navSkeleton} />
                        ) : session ? (
                            <>
                                <Link href="/dashboard" className={styles.userBtn}>
                                    <span className={styles.userAvatar}>
                                        {session.user?.image ? (
                                            <img src={session.user.image} alt="" className={styles.avatarImg} />
                                        ) : (
                                            getInitials(session.user?.name)
                                        )}
                                    </span>
                                    <span className={styles.userName}>{session.user?.name?.split(' ')[0]}</span>
                                </Link>
                                <button
                                    className={styles.logoutBtn}
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    aria-label="Sign out"
                                >
                                    <HiOutlineLogout />
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className={styles.loginBtn}>Log in</Link>
                                <Link href="/register" className={styles.signupBtn}>Get Started</Link>
                            </>
                        )}
                        <button className={styles.menuBtn} onClick={() => setMobileOpen(true)}>
                            <HiOutlineMenu />
                        </button>
                    </div>
                </div>
            </nav>

            <div className={`${styles.mobileMenu} ${mobileOpen ? styles.open : ''}`}>
                <button className={styles.closeBtn} onClick={() => setMobileOpen(false)}>
                    <HiOutlineX />
                </button>
                <Link href="/#features" className={styles.navLink} onClick={() => setMobileOpen(false)}>Features</Link>
                <Link href="/#how-it-works" className={styles.navLink} onClick={() => setMobileOpen(false)}>How It Works</Link>
                <Link href="/#pricing" className={styles.navLink} onClick={() => setMobileOpen(false)}>Pricing</Link>
                {session ? (
                    <>
                        <Link href="/dashboard" className={styles.navLink} onClick={() => setMobileOpen(false)}>Dashboard</Link>
                        <button className={styles.loginBtn} onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }}>Sign Out</button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className={styles.loginBtn} onClick={() => setMobileOpen(false)}>Log in</Link>
                        <Link href="/register" className={styles.signupBtn} onClick={() => setMobileOpen(false)}>Get Started</Link>
                    </>
                )}
            </div>
        </>
    );
}
