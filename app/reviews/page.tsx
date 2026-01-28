'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MotionWrapper, { itemVariants } from '@/app/components/ui/MotionWrapper';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { ArrowLeft, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import styles from './reviews.module.css';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function ReviewsPage() {
    const [activeTab, setActiveTab] = useState<'open' | 'mine'>('open');
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<any>(null);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [activeTab]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const type = activeTab === 'mine' ? 'mine' : 'open';
            const res = await fetch(`/api/reviews?type=${type}`);
            const data = await res.json();
            setReviews(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const submitFeedback = async (id: number) => {
        if (!feedback.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/reviews/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback })
            });
            if (res.ok) {
                setSelectedReview(null);
                setFeedback('');
                fetchReviews(); // Refresh list
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>
                    <ArrowLeft size={18} /> Back to Dashboard
                </Link>
                <h1 className={styles.title}>Peer Code Reviews</h1>
                <p className={styles.subtitle}>Review code from your peers or track your requests.</p>
            </header>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    onClick={() => { setActiveTab('open'); setSelectedReview(null); }}
                    className={`${styles.tabBtn} ${activeTab === 'open' ? styles.activeTab : ''}`}
                >
                    Review Others
                </button>
                <button
                    onClick={() => { setActiveTab('mine'); setSelectedReview(null); }}
                    className={`${styles.tabBtn} ${activeTab === 'mine' ? styles.activeTab : ''}`}
                >
                    My Requests
                </button>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : (
                <MotionWrapper className="review-grid">
                    {/* List View */}
                    {!selectedReview && (
                        <div className={styles.grid}>
                            {reviews.map((r) => (
                                <motion.div
                                    key={r.id}
                                    variants={itemVariants}
                                    className={styles.card}
                                    onClick={() => setSelectedReview(r)}
                                    whileHover={{ y: -4 }}
                                >
                                    <div className={styles.cardHeader}>
                                        <span className={styles.langBadge}>{r.language}</span>
                                        <span className={styles.date}>{new Date(r.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className={styles.cardTitle}>
                                        {activeTab === 'open' ? `Request by @${r.requester_username}` : `Review for Question #${r.question_id}`}
                                    </h3>
                                    <div className={styles.codePreview}>
                                        {r.code_snippet}
                                    </div>
                                    <div className={styles.status}>
                                        {r.status === 'completed' ? (
                                            <span className={styles.statusCompleted} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <CheckCircle size={16} /> Completed
                                            </span>
                                        ) : (
                                            <span className={styles.statusPending} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <Clock size={16} /> Pending Review
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {reviews.length === 0 && !selectedReview && (
                        <div className={styles.emptyState}>
                            No reviews found in this category.
                        </div>
                    )}

                    {/* Detail View */}
                    {selectedReview && (
                        <div className={styles.detailLayout}>
                            <div>
                                <button onClick={() => setSelectedReview(null)} className={styles.backBtn}>
                                    <ArrowLeft size={18} /> Back to list
                                </button>
                                <h2 className={styles.sectionTitle}>Code Snippet</h2>
                                <div className={styles.editorContainer}>
                                    <Editor
                                        height="100%"
                                        defaultLanguage={selectedReview.language || 'python'}
                                        theme="light" // Force light theme for consistency
                                        value={selectedReview.code_snippet}
                                        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14 }}
                                    />
                                </div>
                            </div>

                            <div className={styles.feedbackSection}>
                                <h2 className={styles.sectionTitle}>Feedback</h2>

                                {/* If viewing own completed request, show feedback */}
                                {activeTab === 'mine' && selectedReview.status === 'completed' && (
                                    <div className={styles.feedbackDisplay}>
                                        <div className={styles.reviewerName}>Reviewer: @{selectedReview.reviewer_username}</div>
                                        <p className={styles.feedbackText}>{selectedReview.feedback}</p>
                                    </div>
                                )}

                                {/* If viewing own pending request */}
                                {activeTab === 'mine' && selectedReview.status === 'pending' && (
                                    <div className={styles.pendingBox}>
                                        Your request is waiting for a reviewer.
                                    </div>
                                )}

                                {/* If reviewing others */}
                                {activeTab === 'open' && (
                                    <div>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Write constructive feedback here..."
                                            className={styles.feedbackInput}
                                        />
                                        <button
                                            onClick={() => submitFeedback(selectedReview.id)}
                                            disabled={submitting || !feedback.trim()}
                                            className={styles.submitBtn}
                                        >
                                            {submitting ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </MotionWrapper>
            )}
        </div>
    );
}
