'use client';

import { Search, Bell, User, MessageCircle } from 'lucide-react';
import styles from './topbar.module.css';

interface TopBarProps {
    username?: string;
    onSearch?: (query: string) => void;
    fullName?: string;
    avatarUrl?: string;
}

export default function TopBar({ username, onSearch, fullName, avatarUrl }: TopBarProps) {
    // Mock avatars for the "social proof" row
    const avatars = [
        { bg: '#E0F2FE', color: '#0369A1' },
        { bg: '#DCFCE7', color: '#15803D' },
        { bg: '#FEF3C7', color: '#B45309' },
        { bg: '#FEE2E2', color: '#B91C1C' },
        { bg: '#F3E8FF', color: '#7E22CE' },
    ];

    return (
        <header className={styles.topbar}>
            {/* Search Area */}
            <div className={styles.searchContainer}>
                <Search className={styles.searchIcon} size={20} />
                <input
                    type="text"
                    placeholder="Search for a course..."
                    className={styles.searchInput}
                    onChange={(e) => onSearch && onSearch(e.target.value)}
                />
                <button className={styles.goBtn}>GO</button>
            </div>

            <div className={styles.actions}>
                <a href="/chat" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--text-dark)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    transition: 'opacity 0.2s'
                }}>
                    <MessageCircle size={18} />
                    <span>Chat</span>
                </a>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', padding: '0.25rem 0.75rem 0.25rem 0.25rem', borderRadius: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <img
                        src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                        alt="Profile"
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-dark)' }}>{fullName || username}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Student</span>
                    </div>
                </div>

                <button className={styles.iconBtn}>
                    <Bell size={20} />
                    <span className={styles.badge} />
                </button>
            </div>
        </header>
    );
}
