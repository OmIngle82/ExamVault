'use client';

import { useState, useEffect, useState as useChartState } from 'react';
import DashboardLayout from './DashboardLayout';
import TestCard from './TestCard';
import MenuWidget from './MenuWidget';
import FeaturedCard from './FeaturedCard';
import ScheduleTile from './ScheduleTile';
import { useRouter } from 'next/navigation';
import Modal from './ui/Modal';
import { useToast } from '@/app/context/ToastContext';
import styles from './dashboard.module.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [testToDelete, setTestToDelete] = useState<number | null>(null);
    const router = useRouter();
    const { addToast } = useToast();

    const activeTestsCount = tests.length;
    const completedCount = completedTestIds.length;

    const handleDeleteClick = (id: number) => {
        setTestToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!testToDelete) return;

        try {
            await fetch(`/api/tests/${testToDelete}`, { method: 'DELETE' });
            setTests(prev => prev.filter(t => t.id !== testToDelete));
            addToast('Test deleted successfully', 'success');
            router.refresh();
        } catch (e) {
            addToast('Failed to delete test', 'error');
        }
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
                                    onDelete={handleDeleteClick}
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

                    {/* Growth Chart Widget */}
                    {role === 'student' && (
                        <div className={styles.card} style={{ marginBottom: '1rem', padding: '1.5rem', borderRadius: '24px', background: 'white', boxShadow: '0px 10px 40px rgba(0,0,0,0.03)' }}>
                            <h3 style={{ marginBottom: '1rem' }}>📈 Performance Trend</h3>
                            <GrowthChart username={username} />
                        </div>
                    )}

                    <ScheduleTile tests={tests} />

                    {/* Removed FeaturedCard and MenuWidget as per user request */}
                </div>

            </div>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Test?"
                description="This action cannot be undone. All student submissions for this test will be permanently removed."
                confirmText="Delete Forever"
                isDestructive={true}
                onConfirm={confirmDelete}
            />
        </DashboardLayout>
    );
}

function GrowthChart({ username }: { username: string }) {
    const [data, setData] = useChartState<any[]>([]);
    const [loading, setLoading] = useChartState(true);

    useEffect(() => {
        fetch(`/api/analytics/student/growth?username=${username}`)
            .then(res => res.json())
            .then(json => {
                if (json.growth) setData(json.growth);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [username]);

    if (loading) return <div style={{ height: '150px', background: '#f9fafb', borderRadius: '12px' }} />;
    if (data.length === 0) return <p style={{ fontSize: '0.9rem', color: '#888' }}>No data yet. Take a test!</p>;

    return (
        <div style={{ width: '100%', height: 200, marginLeft: '-20px' }}>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
