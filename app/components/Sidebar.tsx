'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutGrid, // Dashboard (now Home)
    History,    // History
    Trophy,     // Leaderboard
    Settings,
    Calendar,
    Zap,
    LogOut,
    Users
} from 'lucide-react';
import styles from './sidebar.module.css';

interface SidebarProps {
    role: 'admin' | 'student';
    username: string;
}

export default function Sidebar({ role, username }: SidebarProps) {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    return (
        <aside className={styles.container}>
            {/* Brand */}
            <div className={styles.brand}>
                Timed Forms
            </div>

            <div className={styles.card}>
                <nav className={styles.nav}>
                    <Link href="/" className={`${styles.link} ${isActive('/') ? styles.active : ''}`}>
                        <LayoutGrid size={20} />
                        <span>Dashboard</span>
                    </Link>

                    <Link href="/history" className={`${styles.link} ${isActive('/history') ? styles.active : ''}`}>
                        <History size={20} />
                        <span>History</span>
                    </Link>

                    <Link href="/leaderboard" className={`${styles.link} ${isActive('/leaderboard') ? styles.active : ''}`}>
                        <Trophy size={20} />
                        <span>Leaderboard</span>
                    </Link>

                    <Link href={role === 'admin' ? '/admin/communities' : '/communities'} className={`${styles.link} ${isActive(role === 'admin' ? '/admin/communities' : '/communities') ? styles.active : ''}`}>
                        <Users size={20} />
                        <span>Communities</span>
                    </Link>

                    {role === 'admin' && (
                        <Link href="/admin/create" className={`${styles.link} ${isActive('/admin/create') ? styles.active : ''}`}>
                            <Calendar size={20} />
                            <span>Create Test</span>
                        </Link>
                    )}
                </nav>

                <div className={styles.bottomNav}>
                    <Link href="/settings" className={styles.settingsCard}>
                        <div className={styles.settingsIcon}>
                            <Settings size={20} />
                        </div>
                        <div>
                            <span className={styles.settingsTitle}>My Settings</span>
                            <span className={styles.settingsDesc}>Manage Profile</span>
                        </div>
                    </Link>
                </div>
            </div>
        </aside>
    );
}
