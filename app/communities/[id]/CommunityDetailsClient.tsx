'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, FileText, Trophy, Users } from 'lucide-react';
import CommunityChat from '@/app/components/CommunityChat';
import Modal from '@/app/components/ui/Modal';
import { motion } from 'framer-motion';

export default function CommunityDetailsClient({ community, userId, username }: { community: any, userId: number, username: string }) {
    const [activeTab, setActiveTab] = useState<'tests' | 'chat' | 'leaderboard' | 'members'>('tests');
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [tests, setTests] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);

    useEffect(() => {
        fetchTests();
    }, []);

    useEffect(() => {
        if (activeTab === 'leaderboard' && leaderboard.length === 0) {
            fetchLeaderboard();
        } else if (activeTab === 'members' && members.length === 0) {
            fetchMembers();
        }
    }, [activeTab]);

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

    const fetchMembers = async () => {
        try {
            const res = await fetch(`/api/communities/${community.id}/members`);
            const data = await res.json();
            if (data.members) setMembers(data.members);
        } catch (e) { console.error(e); }
    };

    const [memberToRemove, setMemberToRemove] = useState<number | null>(null);

    const handleRemoveClick = (memberId: number) => {
        setMemberToRemove(memberId);
    };

    const confirmRemoveMember = async () => {
        if (!memberToRemove) return;

        try {
            const res = await fetch(`/api/communities/${community.id}/members`, {
                method: 'DELETE',
                body: JSON.stringify({ userIdToRemove: memberToRemove })
            });
            if (res.ok) {
                setMembers(prev => prev.filter(m => m.user_id !== memberToRemove && m.id !== memberToRemove));
                fetchMembers();
                // alert('Member removed.'); // Removed alert for cleaner UX
            } else {
                alert('Failed to remove.'); // Ideally toast, but keeping alert for error handling consistency if toast not available here
            }
        } catch (e) {
            console.error(e);
        } finally {
            setMemberToRemove(null);
        }
    };



    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'end',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#1f2937' }}>{community.name}</h1>
                    <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '1rem' }}>{community.description}</p>
                </div>
                <div style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                }}>
                    Code: <span style={{ fontFamily: 'monospace' }}>{community.code}</span>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', overflowX: 'auto' }}>
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
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
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
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
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
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <Trophy size={18} /> Leaderboard
                </button>
                {/* Admin Only Tab - Debug: {community.owner_id} vs {userId} */}
                {(Number(community.owner_id) === Number(userId) || community.owner_id == userId) && (
                    <button
                        onClick={() => setActiveTab('members')}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: 'transparent',
                            color: activeTab === 'members' ? '#6366f1' : '#6b7280',
                            fontWeight: activeTab === 'members' ? 700 : 500,
                            borderBottom: activeTab === 'members' ? '2px solid #6366f1' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Users size={18} /> Members
                    </button>
                )}
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

                {/* MEMBERS TAB */}
                {activeTab === 'members' && (
                    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '1rem', background: '#f8fafc', fontWeight: 'bold', color: '#64748b', borderBottom: '1px solid #e5e7eb' }}>
                            Manage Students
                        </div>
                        {members.length > 0 ? (
                            members.map((member) => (
                                <div key={member.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
                                            <img
                                                src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
                                                alt={member.username}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{member.full_name || member.username}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>@{member.username}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Joined: {new Date(member.joined_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveClick(member.user_id)}
                                        style={{
                                            background: '#ffe4e6',
                                            color: '#e11d48',
                                            border: 'none',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No members found.</div>
                        )}
                    </div>
                )}

                <Modal
                    isOpen={!!memberToRemove}
                    onClose={() => setMemberToRemove(null)}
                    title="Remove Student"
                    description="Are you sure you want to remove this student from the community?"
                    confirmText="Remove"
                    isDestructive={true}
                    onConfirm={confirmRemoveMember}
                />
            </motion.div>
        </div>
    );
}
