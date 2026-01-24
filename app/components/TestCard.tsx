'use client';

import Link from 'next/link';
import { Clock, Play, MoreVertical, CheckCircle, Users, Trash2 } from 'lucide-react';
import styles from './testCard.module.css';

interface TestCardProps {
    test: any;
    role: 'admin' | 'student';
    isCompleted?: boolean;
    onDelete?: (id: number) => void;
}

import { motion } from 'framer-motion';

export default function TestCard({ test, role, isCompleted, onDelete }: TestCardProps) {
    const isFaculty = role === 'admin';
    const colors = ['#FEE2E2', '#FEF3C7', '#DCFCE7', '#E0F2FE', '#F3E8FF'];
    const randomColor = colors[test.title.length % colors.length];

    const isScheduledFuture = test.scheduled_at && new Date(test.scheduled_at) > new Date();

    return (
        <motion.div
            className={styles.card}
            style={{ opacity: isCompleted ? 0.8 : 1 }}
            whileHover={{ scale: 1.02, y: -4, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            {/* Icon Left */}
            <div className={styles.iconBox} style={{ background: randomColor }}>
                <img
                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${test.title}`}
                    alt="icon"
                    className={styles.iconImg}
                />
            </div>

            {/* Content Center */}
            <div className={styles.content}>
                <div className={styles.hours}>
                    <Clock size={14} />
                    <span>{test.duration_minutes} Mins</span>
                </div>
                <h3 className={styles.title}>{test.title}</h3>

                {/* Community Tag */}
                {test.community_name && (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#ECE9FE',
                        color: '#7C3AED',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        marginBottom: '0.5rem',
                        width: 'fit-content'
                    }}>
                        <Users size={12} /> {test.community_name}
                    </div>
                )}

                {/* Scheduled Tag */}
                {(test.scheduled_at || test.start_time) && (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#EFF6FF',
                        color: '#2563EB',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        width: 'fit-content'
                    }}>
                        <Clock size={12} />
                        Scheduled: {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(test.scheduled_at || test.start_time))}
                    </div>
                )}

                <p className={styles.desc}>{test.description}</p>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {isFaculty ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <Link href={`/admin/results/${test.id}`} className={styles.resultsBtn}>
                                Results
                            </Link>
                            <Link href={`/admin/test/${test.id}/host`} className={styles.hostBtn}>
                                <Play size={14} /> Host Live
                            </Link>
                            <Link href={`/admin/test/${test.id}/analytics`} className={styles.analyticsBtn}>
                                📊 Analytics
                            </Link>
                        </div>
                    ) : (
                        isCompleted ? (
                            <span className={styles.completedBadge}>
                                <CheckCircle size={16} /> Completed
                            </span>
                        ) : (
                            <Link
                                href={isScheduledFuture ? '#' : `/tests/${test.id}`}
                                className={isScheduledFuture ? styles.lockedBtn : styles.enrollLink}
                                aria-disabled={isScheduledFuture}
                            >
                                {isScheduledFuture ? (
                                    <>
                                        <Clock size={14} /> Locked
                                    </>
                                ) : 'Start Test →'}
                            </Link>
                        )
                    )}
                </div>
            </div>

            {/* Actions Right (Faculty only) */}
            {isFaculty && (
                <button
                    className={styles.menuBtn}
                    onClick={() => onDelete && onDelete(test.id)}
                    style={{ color: '#DC2626', background: '#FEE2E2', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                    title="Delete Test"
                >
                    <Trash2 size={18} />
                </button>
            )}
        </motion.div>
    );
}
