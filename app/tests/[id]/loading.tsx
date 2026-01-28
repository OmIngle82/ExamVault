'use client';

import styles from '@/app/components/ui/loading.module.css';

export default function Loading() {
    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            {/* Skeleton Header */}
            <div style={{
                height: '200px',
                background: '#f3f4f6',
                borderRadius: '16px',
                marginBottom: '2rem',
                animation: 'pulse 1.5s infinite'
            }} />

            {/* Skeleton Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{
                        height: '100px',
                        background: '#f3f4f6',
                        borderRadius: '12px',
                        animation: 'pulse 1.5s infinite'
                    }} />
                ))}
            </div>

            {/* Skeleton Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {[1, 2, 3].map((i) => (
                    <div key={i} style={{
                        height: '150px',
                        background: '#f3f4f6',
                        borderRadius: '12px',
                        animation: 'pulse 1.5s infinite'
                    }} />
                ))}
            </div>

            <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
        </div>
    );
}
