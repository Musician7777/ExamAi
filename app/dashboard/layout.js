'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '../providers/ThemeProvider';
import {
    HiOutlineHome, HiOutlineLightningBolt, HiOutlineUpload,
    HiOutlineCode, HiOutlineChatAlt2, HiOutlineChartBar,
    HiOutlineMenu,
    HiOutlineSun, HiOutlineMoon, HiOutlineLogout,
} from 'react-icons/hi';
import styles from './dashboard.module.css';

const navItems = [
    {
        section: 'Main', items: [
            { href: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
            { href: '/dashboard/generate', icon: HiOutlineLightningBolt, label: 'Generate Exam' },
            { href: '/dashboard/upload', icon: HiOutlineUpload, label: 'Upload Pattern' },
        ]
    },
    {
        section: 'Assessment', items: [
            { href: '/dashboard/coding', icon: HiOutlineCode, label: 'Coding Test' },
            { href: '/dashboard/interview', icon: HiOutlineChatAlt2, label: 'Interview Sim' },
            { href: '/dashboard/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
        ]
    },
];

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const { data: session } = useSession();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className={styles.dashLayout}>
            <button className={styles.mobileToggle} onClick={() => setSidebarOpen(true)}>
                <HiOutlineMenu />
            </button>

            <div className={`${styles.overlay} ${sidebarOpen ? styles.open : ''}`} onClick={() => setSidebarOpen(false)} />

            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
                <Link href="/" className={styles.sidebarLogo}>
                    <span className={styles.logoIcon}>E</span>
                    <span>Exam<span className="gradient-text">AI</span></span>
                </Link>

                <nav className={styles.sidebarNav}>
                    {navItems.map((section) => (
                        <div key={section.section} className={styles.navSection}>
                            <div className={styles.navSectionTitle}>{section.section}</div>
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Icon className={styles.icon} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}

                    <div className={styles.navSection}>
                        <div className={styles.navSectionTitle}>Settings</div>
                        <button className={styles.navItem} onClick={toggleTheme}>
                            {theme === 'dark' ? <HiOutlineSun className={styles.icon} /> : <HiOutlineMoon className={styles.icon} />}
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        <button
                            className={styles.navItem}
                            onClick={() => signOut({ callbackUrl: '/' })}
                        >
                            <HiOutlineLogout className={styles.icon} />
                            Sign Out
                        </button>
                    </div>
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userCard}>
                        <div className={styles.userAvatar}>
                            {session?.user?.image ? (
                                <img
                                    src={session.user.image}
                                    alt=""
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                getInitials(session?.user?.name)
                            )}
                        </div>
                        <div>
                            <div className={styles.userName}>{session?.user?.name || 'User'}</div>
                            <div className={styles.userEmail}>{session?.user?.email || ''}</div>
                        </div>
                    </div>
                </div>
            </aside>

            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
