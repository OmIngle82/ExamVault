'use client';

import { useState } from 'react';
import { MessageCircle, FileText, Trophy } from 'lucide-react';
import CommunityChat from '@/app/components/CommunityChat';
import { motion } from 'framer-motion';

export default function CommunityDetailsClient({ community, userId, username }: { community: any, userId: number, username: string }) {
    const [activeTab, setActiveTab] = useState<'tests' | 'chat' | 'leaderboard'>('tests');

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
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb', borderRadius: '12px' }}>
                        <p style={{ color: '#6b7280' }}>No tests assigned to this community yet.</p>
                        {/* List tests here in future */}
                    </div>
                )}

                {activeTab === 'chat' && (
                    <CommunityChat communityId={community.id} isActive={activeTab === 'chat'} />
                )}

                {activeTab === 'leaderboard' && (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb', borderRadius: '12px' }}>
                        <p>🏆 Leaderboard coming soon!</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
