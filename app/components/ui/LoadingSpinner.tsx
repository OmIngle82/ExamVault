'use client';

import { motion } from 'framer-motion';

export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem',
            gap: '1.5rem',
            height: '100%',
            minHeight: '300px'
        }}>
            <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                <motion.div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: '4px solid #e2e8f0',
                        borderTopColor: '#6366f1',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                    style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '4px solid #e2e8f0',
                        borderTopColor: '#a855f7',
                        opacity: 0.7
                    }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
            </div>
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    color: '#64748b',
                    fontWeight: '600',
                    fontSize: '1rem',
                    letterSpacing: '0.02em'
                }}
            >
                {text}
            </motion.p>
        </div>
    );
}
