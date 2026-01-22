'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { Save, User, UserCircle, Upload, LogOut, Trophy, Star } from 'lucide-react';
import styles from './settings.module.css';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';

// Avatar seeds for Dicebear
const avatars = ['Felix', 'Aneka', 'Zack', 'Midnight', 'Shadow', 'Sky'];

interface SettingsClientProps {
    initialFullName: string;
    initialAvatar: string;
    role: string;
    username: string;
    xp: number;
    badges: any[];
}

export default function SettingsClient({ initialFullName, initialAvatar, role, username, xp, badges }: SettingsClientProps) {
    const [fullName, setFullName] = useState(initialFullName);
    const [avatarSeed, setAvatarSeed] = useState(initialAvatar || 'Felix');
    const [status, setStatus] = useState<'' | 'loading' | 'success' | 'error'>('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { addToast } = useToast();

    const isCustomAvatar = avatarSeed.startsWith('/') || avatarSeed.startsWith('http');
    const displayAvatarUrl = isCustomAvatar
        ? avatarSeed
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setStatus('loading');
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                setAvatarSeed(data.url); // Set to local URL
                setStatus('');
                addToast('Avatar uploaded successfully!', 'success');
            } else {
                addToast('Upload failed', 'error');
                setStatus('error');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            // Determine final URL
            const finalAvatarUrl = isCustomAvatar
                ? avatarSeed
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;

            const res = await fetch('/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: fullName,
                    avatar_url: finalAvatarUrl
                })
            });

            if (!res.ok) throw new Error('Failed to update');

            setStatus('success');
            addToast('Settings saved successfully!', 'success');
            router.refresh();
            // Clear success message after 2s
            setTimeout(() => setStatus(''), 2000);

        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <DashboardLayout
            role={role as any}
            username={username}
            fullName={fullName}
            avatarUrl={displayAvatarUrl}
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>My Profile</h1>
                    <p>Manage your account settings and view achievements.</p>
                </div>

                {/* GAMIFICATION CARD */}
                <div className={styles.card} style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', color: '#0369a1', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Trophy size={20} /> Achievements
                            </h2>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0c4a6e' }}>
                                {xp.toLocaleString()} <span style={{ fontSize: '1rem', color: '#0284c7' }}>XP</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600', color: '#0369a1' }}>Badges Unlocked</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{badges.length}</div>
                        </div>
                    </div>

                    {badges.length > 0 ? (
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {badges.map((b, idx) => (
                                <div key={idx} title={b.description} style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{b.icon}</span>
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>{b.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ marginTop: '1rem', fontStyle: 'italic', color: '#64748b' }}>No badges yet. Start taking tests!</div>
                    )}
                </div>

                <form onSubmit={handleSave} className={styles.card}>
                    <div className={styles.inputGroup}>
                        <label>Full Name</label>
                        <div className={styles.inputWrapper}>
                            <User size={18} />
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className={styles.input}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Choose Avatar</label>

                        <div className={styles.currentAvatarPreview}>
                            <img
                                src={isCustomAvatar ? avatarSeed : `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                                alt="Current Avatar"
                                className={styles.bigAvatar}
                            />
                            <div className={styles.uploadBox}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    hidden
                                />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.uploadBtn}>
                                    <Upload size={16} /> Upload Photo
                                </button>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>or select a preset:</span>
                            </div>
                        </div>

                        <div className={styles.avatarGrid}>
                            {avatars.map(seed => (
                                <button
                                    key={seed}
                                    type="button"
                                    className={`${styles.avatarOption} ${avatarSeed === seed ? styles.selected : ''}`}
                                    onClick={() => setAvatarSeed(seed)}
                                >
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt={seed} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button type="submit" disabled={status === 'loading'} className={styles.saveBtn}>
                            {status === 'loading' ? 'Saving...' : (
                                <>
                                    <Save size={18} /> Save Changes
                                </>
                            )}
                        </button>
                        {status === 'success' && <span className={styles.successMsg}>✓ Saved!</span>}
                        {status === 'error' && <span className={styles.errorMsg}>✗ Error saving</span>}
                    </div>
                </form>

                <div className={styles.dangerZone}>
                    <h3>Sign Out</h3>
                    <p>Log out of your account on this device.</p>
                    <button
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        className={styles.logoutBtn}
                    >
                        <LogOut size={18} /> Log Out
                    </button>
                </div>

                <Modal
                    isOpen={showLogoutModal}
                    onClose={() => setShowLogoutModal(false)}
                    title="Sign Out"
                    description="Are you sure you want to sign out? You will need to log in again to access your account."
                    confirmText="Sign Out"
                    isDestructive={true}
                    onConfirm={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        addToast('Signed out successfully', 'success');
                        window.location.href = '/login';
                    }}
                />
            </div>
        </DashboardLayout>
    );
}
