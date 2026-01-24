'use client';

import { useState, useEffect, useState as useChartState } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from './DashboardLayout';
import Skeleton from './ui/Skeleton';
import MotionWrapper, { itemVariants } from './ui/MotionWrapper';
import { motion } from 'framer-motion';

// Lazy load GrowthChart (Heavy Recharts bundle)
const GrowthChart = dynamic(() => import('./GrowthChart'), {
    loading: () => <Skeleton height="200px" width="100%" borderRadius="12px" />,
    ssr: false
});

import TestCard from './TestCard';
import MenuWidget from './MenuWidget';
import FeaturedCard from './FeaturedCard';
import ScheduleTile from './ScheduleTile';
import { useRouter } from 'next/navigation';
import Modal from './ui/Modal';
import { useToast } from '@/app/context/ToastContext';
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
            <MotionWrapper className={styles.hero}>
                <motion.div className={styles.heroAvatar} variants={itemVariants}>
                    <img
                        src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                        alt="profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <h1 className={styles.heroTitle}>Hi {fullName || username}</h1>
                    <p className={styles.heroSubtitle}>Let's start learning today.</p>
                </motion.div>
            </MotionWrapper>

            {/* Main Grid Container - REORDERED: Content Left, Widgets Right */}
            <MotionWrapper className={styles.bentoGrid}>

                {/* Column 1: Main Content (Tests) - NOW ON LEFT */}
                <div className={styles.colContent}>
                    <motion.div className={styles.sectionHeader} variants={itemVariants}>
                        <h2>Attempt Test</h2>
                        <span className={styles.badge}>{filteredTests.length} Available</span>
                    </motion.div>

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
                        <motion.div className={styles.statSquare} style={{ background: '#F0F9FF' }} variants={itemVariants}>
                            <span className={styles.hugeNum}>{activeTestsCount}</span>
                            <span className={styles.statLabel}>Active Tests</span>
                        </motion.div>
                        <motion.div className={styles.statSquare} style={{ background: '#FFF1F2' }} variants={itemVariants}>
                            <span className={styles.hugeNum}>{completedCount}</span>
                            <span className={styles.statLabel}>Completed</span>
                        </motion.div>
                    </div>

                    {/* Growth Chart Widget */}
                    {role === 'student' && (
                        <motion.div
                            className={styles.card}
                            style={{ marginBottom: '1rem', padding: '1.5rem', borderRadius: '24px', background: 'white', boxShadow: '0px 10px 40px rgba(0,0,0,0.03)' }}
                            variants={itemVariants}
                        >
                            <h3 style={{ marginBottom: '1rem' }}>📈 Performance Trend</h3>
                            <GrowthChart username={username} />
                        </motion.div>
                    )}

                    <ScheduleTile tests={tests} />

                    {/* Removed FeaturedCard and MenuWidget as per user request */}
                </div>

            </MotionWrapper>

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
