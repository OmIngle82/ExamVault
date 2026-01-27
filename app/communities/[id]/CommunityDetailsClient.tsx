'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, FileText, Trophy } from 'lucide-react';
import CommunityChat from '@/app/components/CommunityChat';
import { motion } from 'framer-motion';

export default function CommunityDetailsClient({ community, userId, username }: { community: any, userId: number, username: string }) {
    const [activeTab, setActiveTab] = useState<'tests' | 'chat' | 'leaderboard'>('tests');
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [tests, setTests] = useState<any[]>([]);

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const res = await fetch(`/api/tests?communityId=${community.id}`);
            const data = await res.json();
            if (data.tests) setTests(data.tests);
        } catch (e) { console.error(e); }
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`/api/communities/${community.id}/leaderboard`);
            const data = await res.json();
            if (data.leaderboard) setLeaderboard(data.leaderboard);
        } catch (e) { console.error(e); }
    };

    if (activeTab === 'leaderboard' && leaderboard.length === 0) {
        fetchLeaderboard();
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                padding: '2rem',
                borderRadius: '24px',
                color: 'white',
                marginBottom: '2rem',
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.2)'
            }}>
                <h1 style={{ margin: 0, fontSize: '2rem' }}>{community.name}</h1>
                <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>{community.description}</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                <button
                    onClick={() => setActiveTab('tests')}
                    style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: 'transparent',
                        color: activeTab === 'tests' ? '#6366f1' : '#6b7280',
                        fontWeight: activeTab === 'tests' ? 700 : 500,
                        borderBottom: activeTab === 'tests' ? '2px solid #6366f1' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <FileText size={18} /> Tests
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: 'transparent',
                        color: activeTab === 'chat' ? '#6366f1' : '#6b7280',
                        fontWeight: activeTab === 'chat' ? 700 : 500,
                        borderBottom: activeTab === 'chat' ? '2px solid #6366f1' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <MessageCircle size={18} /> Chat
                </button>
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: 'transparent',
                        color: activeTab === 'leaderboard' ? '#6366f1' : '#6b7280',
                        fontWeight: activeTab === 'leaderboard' ? 700 : 500,
                        borderBottom: activeTab === 'leaderboard' ? '2px solid #6366f1' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Trophy size={18} /> Leaderboard
                </button>
            </div>

            {/* Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'tests' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {tests.length > 0 ? (
                            tests.map((test) => (
                                <Link href={`/tests/${test.id}`} key={test.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        style={{
                                            background: 'white',
                                            padding: '1.5rem',
                                            borderRadius: '16px',
                                            border: '1px solid #e5e7eb',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                            transition: 'box-shadow 0.2s'
                                        }}
                                    >
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{test.title}</h3>
                                        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem', height: '40px', overflow: 'hidden' }}>
                                            {test.description || 'No description provided.'}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '20px' }}>
                                                {test.duration_minutes || test.time_limit} min
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                                {test.questions ? (Array.isArray(test.questions) ? test.questions.length : JSON.parse(test.questions).length) : 0} Qs
                                            </span>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: '#f9fafb', borderRadius: '12px' }}>
                                <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>No tests assigned to this community yet.</p>
                                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Check back later!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'chat' && (
                    <CommunityChat communityId={community.id} isActive={activeTab === 'chat'} />
                )}

                {activeTab === 'leaderboard' && (
                    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px', padding: '1rem', background: '#f8fafc', fontWeight: 'bold', color: '#64748b' }}>
                            <div>#</div>
                            <div>Student</div>
                            <div style={{ textAlign: 'right' }}>XP</div>
                        </div>
                        {leaderboard.length > 0 ? (
                            leaderboard.map((student, idx) => (
                                <div key={student.id} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px', padding: '1rem', borderTop: '1px solid #f1f5f9', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', color: idx < 3 ? '#d97706' : '#94a3b8' }}>{idx + 1}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
                                            <img
                                                src={student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username}`}
                                                alt={student.username}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{student.full_name || student.username}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>@{student.username}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#6366f1' }}>
                                        {student.xp || 0} XP
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No members found.</div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
