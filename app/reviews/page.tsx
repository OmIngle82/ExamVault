'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MotionWrapper, { itemVariants } from '@/app/components/ui/MotionWrapper';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { MessageSquare, CheckCircle, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';

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
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Peer Code Reviews</h1>
                <p style={{ color: '#666' }}>Review code from your peers or track your requests.</p>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #eee' }}>
                <button
                    onClick={() => { setActiveTab('open'); setSelectedReview(null); }}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'open' ? '3px solid #4F46E5' : '3px solid transparent',
                        color: activeTab === 'open' ? '#4F46E5' : '#666',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Review Others
                </button>
                <button
                    onClick={() => { setActiveTab('mine'); setSelectedReview(null); }}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'mine' ? '3px solid #4F46E5' : '3px solid transparent',
                        color: activeTab === 'mine' ? '#4F46E5' : '#666',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    My Requests
                </button>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : (
                <MotionWrapper className="review-grid" style={{ display: 'grid', gridTemplateColumns: selectedReview ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>

                    {/* List View */}
                    {!selectedReview && reviews.map((r) => (
                        <motion.div
                            key={r.id}
                            variants={itemVariants}
                            style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB', cursor: 'pointer' }}
                            onClick={() => setSelectedReview(r)}
                            whileHover={{ y: -4, boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{r.language}</span>
                                <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                {activeTab === 'open' ? `Request by @${r.requester_username}` : `Review for Question #${r.question_id}`}
                            </h3>
                            <div style={{ background: '#F9FAFB', padding: '0.75rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.9rem', color: '#4B5563', maxHeight: '100px', overflow: 'hidden', marginBottom: '1rem' }}>
                                {r.code_snippet}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: r.status === 'completed' ? '#10B981' : '#F59E0B', fontWeight: 600, fontSize: '0.9rem' }}>
                                {r.status === 'completed' ? <CheckCircle size={16} /> : <Clock size={16} />}
                                {r.status === 'completed' ? 'Completed' : 'Pending Review'}
                            </div>
                        </motion.div>
                    ))}

                    {reviews.length === 0 && !selectedReview && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#666' }}>
                            No reviews found in this category.
                        </div>
                    )}

                    {/* Detail View */}
                    {selectedReview && (
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem', background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                            <div>
                                <button onClick={() => setSelectedReview(null)} style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontWeight: 600 }}>← Back to list</button>
                                <h2 style={{ marginBottom: '1rem' }}>Code Snippet</h2>
                                <div style={{ height: '400px', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                                    <Editor
                                        height="100%"
                                        defaultLanguage={selectedReview.language || 'python'}
                                        value={selectedReview.code_snippet}
                                        options={{ readOnly: true, minimap: { enabled: false } }}
                                    />
                                </div>
                            </div>

                            <div>
                                <h2 style={{ marginBottom: '1rem' }}>Feedback</h2>

                                {/* If viewing own completed request, show feedback */}
                                {activeTab === 'mine' && selectedReview.status === 'completed' && (
                                    <div style={{ background: '#F0FDF4', padding: '1.5rem', borderRadius: '8px', border: '1px solid #86EFAC' }}>
                                        <div style={{ fontWeight: 600, color: '#166534', marginBottom: '0.5rem' }}>Reviewer: @{selectedReview.reviewer_username}</div>
                                        <p style={{ color: '#1F2937' }}>{selectedReview.feedback}</p>
                                    </div>
                                )}

                                {/* If viewing own pending request */}
                                {activeTab === 'mine' && selectedReview.status === 'pending' && (
                                    <div style={{ background: '#FEF3C7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #FDE68A', color: '#92400E' }}>
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
                                            style={{ width: '100%', height: '200px', padding: '1rem', borderRadius: '8px', border: '1px solid #D1D5DB', marginBottom: '1rem', fontFamily: 'inherit' }}
                                        />
                                        <button
                                            onClick={() => submitFeedback(selectedReview.id)}
                                            disabled={submitting || !feedback.trim()}
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem',
                                                background: '#4F46E5',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                cursor: submitting || !feedback.trim() ? 'not-allowed' : 'pointer',
                                                opacity: submitting || !feedback.trim() ? 0.7 : 1
                                            }}
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
