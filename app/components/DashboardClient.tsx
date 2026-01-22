'use client';

import { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import TestCard from './TestCard';
import MenuWidget from './MenuWidget';
import FeaturedCard from './FeaturedCard';
import ScheduleTile from './ScheduleTile';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

interface DashboardClientProps {
    initialTests: any[];
    completedTestIds: number[];
    role: 'admin' | 'student';
    username: string;
    fullName?: string;
    avatarUrl?: string;
}

export default function DashboardClient({ initialTests, completedTestIds, role, username, fullName, avatarUrl }: DashboardClientProps) {
    const [tests, setTests] = useState(initialTests);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const activeTestsCount = tests.length;
    const completedCount = completedTestIds.length;

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        await fetch(`/api/tests/${id}`, { method: 'DELETE' });
        setTests(prev => prev.filter(t => t.id !== id));
        router.refresh();
    };

    const filteredTests = tests.filter(test =>
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout role={role} username={username} onSearch={setSearchQuery} fullName={fullName} avatarUrl={avatarUrl}>
            <div className={styles.hero}>
                <div className={styles.heroAvatar}>
                    <img
                        src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                        alt="profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
                <div>
                    <h1 className={styles.heroTitle}>Hi {fullName || username}</h1>
                    <p className={styles.heroSubtitle}>Let's start learning today.</p>
                </div>
            </div>

            {/* Main Grid Container - REORDERED: Content Left, Widgets Right */}
            <div className={styles.bentoGrid}>

                {/* Column 1: Main Content (Tests) - NOW ON LEFT */}
                <div className={styles.colContent}>
                    <div className={styles.sectionHeader}>
                        <h2>Attempt Test</h2>
                        <span className={styles.badge}>{filteredTests.length} Available</span>
                    </div>

                    <div className={styles.testList}>
                        {filteredTests.length > 0 ? (
                            filteredTests.map(test => (
                                <TestCard
                                    key={test.id}
                                    test={test}
                                    isCompleted={completedTestIds.includes(test.id)}
                                    role={role}
                                    onDelete={handleDelete}
                                />
                            ))
                        ) : (
                            <p className={styles.empty}>
                                {searchQuery ? `No tests found matching "${searchQuery}"` : 'No active tests.'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Column 2: Widgets & Featured - Stacked on RIGHT */}
                <div className={styles.colSidebar}>

                    {/* Square Stats moved here */}
                    <div className={styles.statsRow}>
                        <div className={styles.statSquare} style={{ background: '#F0F9FF' }}>
                            <span className={styles.hugeNum}>{activeTestsCount}</span>
                            <span className={styles.statLabel}>Active Tests</span>
                        </div>
                        <div className={styles.statSquare} style={{ background: '#FFF1F2' }}>
                            <span className={styles.hugeNum}>{completedCount}</span>
                            <span className={styles.statLabel}>Completed</span>
                        </div>
                    </div>

                    <ScheduleTile tests={tests} />

                    {/* Removed FeaturedCard and MenuWidget as per user request */}
                </div>

            </div>
        </DashboardLayout>
    );
}
