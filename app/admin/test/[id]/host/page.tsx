'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { useToast } from '@/app/context/ToastContext';
import { ArrowRight, Play, Square, RefreshCcw } from 'lucide-react';

export default function HostPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { addToast } = useToast();
    const [test, setTest] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [status, setStatus] = useState('draft');
    const [loading, setLoading] = useState(true);

    // Unwrap params
    const [testId, setTestId] = useState<string>('');
    useEffect(() => {
        params.then(p => setTestId(p.id));
    }, [params]);

    useEffect(() => {
        if (!testId) return;

        // Load initial test data
        fetch(`/api/tests/${testId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.id) {
                    setTest(data);
                    setQuestions(data.questions || []);
                    setCurrentIndex(data.current_question_index ?? -1);
                    setStatus(data.status || 'draft');
                } else {
                    // Handle manual 404
                    setTest(null);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [testId]);

    const updateState = async (action: string, newIndex?: number) => {
        try {
            const res = await fetch(`/api/tests/${testId}/live`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, index: newIndex })
            });
            if (!res.ok) throw new Error('Failed to update');

            if (action === 'start') {
                setStatus('active');
                setCurrentIndex(0);
                addToast('Live Session Started! 🔴', 'success');
            } else if (action === 'end') {
                setStatus('ended');
                addToast('Session Ended', 'info');
            } else if (action === 'next') {
                if (newIndex !== undefined) setCurrentIndex(newIndex);
            } else if (action === 'reset') {
                setStatus('draft');
                setCurrentIndex(-1);
                addToast('Reset to Self-Paced', 'info');
            }

        } catch (err) {
            addToast('Error updating state', 'error');
        }
    };

    const currentQ = questions[currentIndex];

    if (loading) return <LoadingSpinner text="Preparing Host Panel..." />;
    if (!test) return <div style={{ padding: '2rem' }}>Test not found</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Host Panel: {test.title}</h1>
                    <p style={{ color: '#666', margin: 0 }}>Control the flow of the exam in real-time.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ padding: '0.5rem 1rem', background: status === 'active' ? '#fee2e2' : '#f3f4f6', color: status === 'active' ? '#ef4444' : '#6b7280', borderRadius: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {status === 'active' && <span style={{ display: 'block', width: '10px', height: '10px', background: 'red', borderRadius: '50%', animation: 'pulse 1s infinite' }}></span>}
                        {status.toUpperCase()}
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                {/* MAIN VIEW */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>

                    {status === 'draft' && (
                        <div>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👋</div>
                            <h2>Ready to go Live?</h2>
                            <p style={{ color: '#666', marginBottom: '2rem' }}>Students will see questions appear as you advance them.</p>
                            <button
                                onClick={() => updateState('start')}
                                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '1rem 2rem', fontSize: '1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                                <Play size={24} /> Start Live Session
                            </button>
                        </div>
                    )}

                    {status === 'active' && currentQ && (
                        <div style={{ width: '100%' }}>
                            <div style={{ marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#666', fontSize: '0.9rem' }}>
                                Question {currentIndex + 1} of {questions.length}
                            </div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>{currentQ.prompt}</h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                                {currentQ.options && currentQ.options.map((opt: string, idx: number) => (
                                    <div key={idx} style={{ padding: '1rem', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '8px', textAlign: 'left', fontWeight: 600 }}>
                                        {String.fromCharCode(65 + idx)}. {opt}
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                {currentIndex < questions.length - 1 ? (
                                    <button
                                        onClick={() => updateState('next', currentIndex + 1)}
                                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '1rem 2rem', fontSize: '1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                                    >
                                        Next Question <ArrowRight />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => updateState('end')}
                                        style={{ background: '#ef4444', color: 'white', border: 'none', padding: '1rem 2rem', fontSize: '1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                                    >
                                        <Square fill="currentColor" /> End Test
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {status === 'ended' && (
                        <div>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏁</div>
                            <h2>Session Ended</h2>
                            <p>Students can now see their results.</p>
                            <button
                                onClick={() => updateState('reset')}
                                style={{ marginTop: '1rem', background: 'transparent', color: '#666', border: '1px solid #ccc', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                                <RefreshCcw size={16} /> Reset to Self-Paced
                            </button>
                        </div>
                    )}
                </div>

                {/* SIDEBAR */}
                <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '12px', height: 'fit-content' }}>
                    <h3 style={{ marginTop: 0 }}>Question Map</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                        {questions.map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    aspectRatio: '1/1',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: i === currentIndex ? '#2563eb' : (i < currentIndex ? '#dbeafe' : 'white'),
                                    color: i === currentIndex ? 'white' : 'black',
                                    borderRadius: '8px', border: '1px solid #e5e7eb',
                                    fontWeight: 'bold'
                                }}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
