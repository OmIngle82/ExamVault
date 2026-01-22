'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Copy } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import styles from './communities.module.css';

interface Community {
    id: number;
    name: string;
    code: string;
    description: string;
    member_count?: number;
}

export default function CommunitiesClient() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCommunities();
    }, []);

    const fetchCommunities = async () => {
        try {
            const res = await fetch('/api/communities');
            if (!res.ok) throw new Error(`Status: ${res.status}`);

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('API returned non-JSON:', text.slice(0, 100));
                return; // Stop if invalid
            }

            if (data.communities) setCommunities(data.communities);
        } catch (error) {
            console.error(error);
            addToast('Failed to load communities', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;

        try {
            const res = await fetch('/api/communities', {
                method: 'POST',
                body: JSON.stringify({ name: newName, description: newDesc })
            });
            const data = await res.json();

            if (data.success) {
                addToast('Community created!', 'success');
                setShowCreateModal(false);
                setNewName('');
                setNewDesc('');
                fetchCommunities();
            } else {
                addToast('Failed to create', 'error');
            }
        } catch (error) {
            addToast('Error creating community', 'error');
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        addToast('Code copied to clipboard', 'success');
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>My Communities</h1>
                    <p>Manage your classes and student groups.</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className={styles.createBtn}>
                    <Plus size={20} /> Create Community
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className={styles.grid}>
                    {communities.map(c => (
                        <div key={c.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3>{c.name}</h3>
                                <div className={styles.badge} onClick={() => copyCode(c.code)}>
                                    Code: {c.code} <Copy size={12} />
                                </div>
                            </div>
                            <p className={styles.desc}>{c.description || 'No description'}</p>
                            <Link href={`/admin/communities/${c.id}`} style={{ textDecoration: 'none' }}>
                                <div className={styles.stats} style={{ color: '#2563EB', fontWeight: 'bold' }}>
                                    <Users size={16} /> {c.member_count || 0} Members • Manage →
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Community"
                confirmText="Create"
                onConfirm={handleCreate}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        autoFocus
                        type="text"
                        placeholder="Community Name (e.g. Science Class 101)"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        style={{
                            padding: '0.75rem',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            fontSize: '1rem'
                        }}
                    />
                    <textarea
                        placeholder="Description (Optional)"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        rows={3}
                        style={{
                            padding: '0.75rem',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>
            </Modal>
        </div>
    );
}
