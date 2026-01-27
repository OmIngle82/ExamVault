'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface ScheduleTileProps {
    tests: any[];
}

export default function ScheduleTile({ tests }: ScheduleTileProps) {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    if (!currentTime) return null; // Hydration fix

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(date);
    };

    // Filter tests scheduled for today
    const todaysTests = tests.filter(test => {
        if (!test.scheduled_at) return false;
        const scheduledDate = new Date(test.scheduled_at);
        const now = new Date();
        return scheduledDate.getDate() === now.getDate() &&
            scheduledDate.getMonth() === now.getMonth() &&
            scheduledDate.getFullYear() === now.getFullYear();
    }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    return (
        <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '1.5rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.03)',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            {/* Header: Date & Time */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1F1D2C', margin: 0 }}>
                        {formatDate(currentTime)}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#9CA3AF', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} />
                        {formatTime(currentTime)}
                    </p>
                </div>
                <div style={{
                    width: '40px',
                    height: '40px',
                    background: '#FEF3C7',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F59E0B'
                }}>
                    <Calendar size={20} />
                </div>
            </div>

            {/* Schedule List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.5px' }}>
                    Scheduled Today
                </span>

                {todaysTests.length > 0 ? (
                    todaysTests.map((test, idx) => (
                        <div key={test.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem',
                            background: '#F9FAFB',
                            borderRadius: '12px',
                            border: '1px solid #F3F4F6'
                        }}>
                            {/* Time Column */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '45px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1F1D2C' }}>
                                    {new Date(test.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                                    {new Date(test.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }).split(' ')[1]}
                                </span>
                            </div>

                            {/* Divider */}
                            <div style={{ width: '2px', height: '24px', background: '#E5E7EB' }}></div>

                            {/* Test Info */}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1F1D2C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                    {test.title}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                                    {test.duration_minutes || test.time_limit} mins • {Array.isArray(test.questions) ? test.questions.length : (test.questions ? JSON.parse(test.questions).length : 0)} Qs
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ fontSize: '0.9rem', color: '#9CA3AF', fontStyle: 'italic' }}>No exams scheduled.</p>
                )}
            </div>
        </div>
    );
}
