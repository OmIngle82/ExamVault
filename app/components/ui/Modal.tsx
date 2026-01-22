'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    isDestructive?: boolean;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    isDestructive = false
}: ModalProps) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                animation: 'scaleUp 0.2s ease-out forwards'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {isDestructive && (
                            <div style={{ padding: '8px', background: '#FEE2E2', borderRadius: '50%', color: '#DC2626' }}>
                                <AlertTriangle size={20} />
                            </div>
                        )}
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1F2937' }}>
                            {title}
                        </h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                        <X size={20} />
                    </button>
                </div>

                {description && (
                    <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                        {description}
                    </p>
                )}

                {children}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.25rem',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            background: 'white',
                            fontWeight: '600',
                            color: '#374151',
                            cursor: 'pointer'
                        }}
                    >
                        {cancelText}
                    </button>
                    {onConfirm && (
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            style={{
                                padding: '0.75rem 1.25rem',
                                border: 'none',
                                borderRadius: '8px',
                                background: isDestructive ? '#DC2626' : '#2563EB',
                                fontWeight: '600',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
            <style jsx>{`
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
