'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import styles from './communities.module.css';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';

interface Community {
    id: number;
    name: string;
    description: string;
    admin_id: string; // admin username
}

export default function StudentCommunitiesClient() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [joinCode, setJoinCode] = useState('');
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
                return;
            }

            if (data.communities) setCommunities(data.communities);
        } catch (error) {
            console.error(error);
            addToast('Failed to load communities', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        try {
            const res = await fetch('/api/communities/join', {
                method: 'POST',
                body: JSON.stringify({ code: joinCode })
            });
            const data = await res.json();

            if (data.success) {
                addToast('Joined community successfully!', 'success');
                setJoinCode('');
                fetchCommunities();
            } else {
                addToast(data.error || 'Failed to join', 'error');
            }
        } catch (error) {
            addToast('Error joining community', 'error');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>My Communities</h1>
                    <p>Join classes to receive tests from your teachers.</p>
                </div>
            </div>

            <div className={styles.joinSection}>
                <h3>Join a Community</h3>
                <form onSubmit={handleJoin} className={styles.joinForm}>
                    <input
                        type="text"
                        placeholder="Enter 6-character code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={6}
                    />
                    <button type="submit">
                        Join <ArrowRight size={18} />
                    </button>
                </form>
            </div>

            <h3 className={styles.subHeader}>Your Groups</h3>
            {loading ? (
                <LoadingSpinner text="Loading Communities..." />
            ) : (
                <div className={styles.grid}>
                    {communities.length > 0 ? communities.map(c => (
                        <div key={c.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3>{c.name}</h3>
                                <span className={styles.adminTag}>By @{c.admin_id}</span>
                            </div>
                            <p className={styles.desc}>{c.description || 'No description'}</p>
                        </div>
                    )) : (
                        <p style={{ color: '#9CA3AF' }}>You haven't joined any communities yet.</p>
                    )}
                </div>
            )}
        </div>
    );
}
