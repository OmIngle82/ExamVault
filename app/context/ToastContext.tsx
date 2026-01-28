'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'white',
                        padding: '16px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        minWidth: '300px',
                        borderLeft: `4px solid ${toast.type === 'success' ? '#10B981' :
                            toast.type === 'error' ? '#EF4444' :
                                toast.type === 'warning' ? '#F59E0B' : '#3B82F6'
                            }`,
                        animation: 'slideIn 0.3s ease-out forwards'
                    }}>
                        {toast.type === 'success' && <CheckCircle size={20} color="#10B981" />}
                        {toast.type === 'error' && <AlertCircle size={20} color="#EF4444" />}
                        {toast.type === 'warning' && <AlertCircle size={20} color="#F59E0B" />}
                        {toast.type === 'info' && <Info size={20} color="#3B82F6" />}

                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#1F2937', flex: 1 }}>{toast.message}</p>

                        <button onClick={() => removeToast(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <style jsx global>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        // Prevent crash during SSR if context is missing for some reason
        if (typeof window === 'undefined') {
            return { addToast: () => { } };
        }
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
