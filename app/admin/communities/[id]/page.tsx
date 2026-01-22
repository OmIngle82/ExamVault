'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';
import { ChevronLeft, UserPlus, Trash2, Search, Copy } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import Modal from '../../../components/ui/Modal';
import styles from '../communities.module.css';

interface Member {
    username: string;
    full_name: string;
    avatar_url: string;
    joined_at: string;
    status: string;
}

export default function ManageCommunityPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [members, setMembers] = useState<Member[]>([]);
    const [community, setCommunity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const { addToast } = useToast();

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            // Get Members
            const mRes = await fetch(`/api/communities/${id}/members`);
            const mData = await mRes.json();
            if (mData.members) setMembers(mData.members);

            // Get Community Info (re-use list API or fetch single... simplified: reusing context or fetching list and filtering is inefficient but quick)
            // Better: Create /api/communities/[id] GET
            // For now, let's just use the members list as proof of life, but we need the Name/Code.
            // Let's quickly add a single fetch endpoint or Just fetch all and find (since list is small).
            const cRes = await fetch('/api/communities');
            const cData = await cRes.json();
            const found = cData.communities?.find((c: any) => c.id == id);
            if (found) setCommunity(found);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }

        const res = await fetch(`/api/users/search?q=${val}`);
        const data = await res.json();
        setSearchResults(data.users || []);
    };

    const handleInvite = async (username: string) => {
        try {
            const res = await fetch(`/api/communities/${id}/invite`, {
                method: 'POST',
                body: JSON.stringify({ username })
            });
            const data = await res.json();

            if (data.success) {
                addToast(`Added @${username}`, 'success');
                setSearchQuery('');
                setSearchResults([]);
                setShowInviteModal(false);
                fetchData(); // Refresh list
            } else {
                addToast(data.error || 'Failed', 'error');
            }
        } catch (e) {
            addToast('Error inviting', 'error');
        }
    };

    const copyCode = () => {
        if (community) {
            navigator.clipboard.writeText(community.code);
            addToast('Code copied!', 'success');
        }
    };

    if (loading) return <DashboardLayout role="admin" username="Admin">Loading...</DashboardLayout>;

    return (
        <DashboardLayout role="admin" username="Admin">
            <div className={styles.container}>
                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/admin/communities" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280', textDecoration: 'none', fontWeight: 600, marginBottom: '1rem' }}>
                        <ChevronLeft size={20} /> Back to Communities
                    </Link>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{community?.name || 'Managing Community'}</h1>
                            <div className={styles.badge} onClick={copyCode} style={{ display: 'inline-flex', marginTop: '0.5rem' }}>
                                Code: {community?.code} <Copy size={14} />
                            </div>
                        </div>
                        <button onClick={() => setShowInviteModal(true)} className={styles.createBtn}>
                            <UserPlus size={20} /> Add Student
                        </button>
                    </div>
                </div>

                <div className={styles.card}>
                    <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                        Members ({members.length})
                    </h3>

                    {members.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {members.map(m => (
                                <div key={m.username} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderRadius: '8px', background: '#F9FAFB' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <img
                                            src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username}`}
                                            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: '700' }}>{m.full_name || m.username}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>@{m.username} • Joined {new Date(m.joined_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    {/* Optional: Remove button could go here */}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>No members yet.</p>
                    )}
                </div>

                <Modal
                    isOpen={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                    title="Add Student"
                    confirmText="Done"
                    onConfirm={() => setShowInviteModal(false)}
                >
                    <div>
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search by username or name..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {searchResults.map(u => (
                                <div
                                    key={u.username}
                                    onClick={() => handleInvite(u.username)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '10px', cursor: 'pointer', borderRadius: '8px',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <img
                                        src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                                        style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{u.full_name || u.username}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>@{u.username}</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', color: '#2563EB', fontSize: '0.85rem', fontWeight: '600' }}>Add +</div>
                                </div>
                            ))}
                            {searchQuery.length >= 2 && searchResults.length === 0 && (
                                <p style={{ color: '#9CA3AF', textAlign: 'center', fontSize: '0.9rem' }}>No users found.</p>
                            )}
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
