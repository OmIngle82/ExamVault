'use client';

import { Flame } from 'lucide-react';

interface StatWidgetProps {
    label: string;
    value: string;
    percentage: number;
}

export default function StatWidget({ label, value, percentage }: StatWidgetProps) {
    return (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{
                    width: '32px', height: '32px', background: 'transparent',
                    border: '2px solid var(--text-dark)', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Flame size={16} color="var(--text-dark)" />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage Goals</span>
            </div>

            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 300, color: 'var(--text-muted)' }}>
                {label}
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{value}</span>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{percentage}%</span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: 'var(--accent-purple)',
                    borderRadius: '4px'
                }} />
            </div>
        </div>
    );
}
