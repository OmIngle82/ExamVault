'use client';

import React, { forwardRef } from 'react';
import styles from './ReportCard.module.css';

interface ReportCardProps {
    testTitle: string;
    studentName: string;
    score: number;
    totalQuestions: number;
    date: string;
    xpEarned?: number;
    badgesUnlocked?: any[];
}

const ReportCard = forwardRef<HTMLDivElement, ReportCardProps>(({ testTitle, studentName, score, totalQuestions, date, xpEarned, badgesUnlocked }, ref) => {
    const percentage = Math.round((score / totalQuestions) * 100);
    const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 50 ? 'C' : 'F';
    const isPass = percentage >= 50;

    return (
        <div ref={ref} className={styles.container}>
            <div className={styles.header}>
                <div className={styles.logo}>EV</div>
                <span>ExamVault</span>
            </div>
            <div className={styles.date}>{date}</div>


            <div className={styles.content}>
                <h1 className={styles.title}>Official Report Card</h1>

                <div className={styles.studentInfo}>
                    <div className={styles.row}>
                        <span className={styles.label}>Student Name:</span>
                        <span className={styles.value}>{studentName}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Test Subject:</span>
                        <span className={styles.value}>{testTitle}</span>
                    </div>
                </div>

                <div className={styles.scoreSection}>
                    <div className={styles.gradeCircle} style={{ borderColor: isPass ? '#22c55e' : '#ef4444' }}>
                        <span className={styles.gradeText} style={{ color: isPass ? '#22c55e' : '#ef4444' }}>{grade}</span>
                        <span className={styles.percentage}>{percentage}%</span>
                    </div>
                    <div className={styles.scoreDetails}>
                        <div className={styles.detailItem}>
                            <span>Score</span>
                            <strong>{score} / {totalQuestions}</strong>
                        </div>
                        <div className={styles.detailItem}>
                            <span>Outcome</span>
                            <strong style={{ color: isPass ? '#22c55e' : '#ef4444' }}>{isPass ? 'PASSED' : 'FAILED'}</strong>
                        </div>
                    </div>
                </div>

                {(xpEarned || (badgesUnlocked && badgesUnlocked.length > 0)) && (
                    <div className={styles.achievements}>
                        <h3>Achievements Unlocked</h3>
                        <div className={styles.badges}>
                            {badgesUnlocked?.map((b: any, idx: number) => (
                                <div key={idx} className={styles.badge}>
                                    <span className={styles.badgeIcon}>{b.icon}</span>
                                    <span>{b.name}</span>
                                </div>
                            ))}
                            {xpEarned && (
                                <div className={styles.xpBadge}>
                                    +{xpEarned} XP
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className={styles.footer}>
                    <p>This document is an electronically generated report from ExamVault.</p>
                    <div className={styles.signature}>
                        <span>Verified by System</span>
                    </div>
                </div>
            </div>
        </div >
    );
});

ReportCard.displayName = 'ReportCard';

export default ReportCard;
