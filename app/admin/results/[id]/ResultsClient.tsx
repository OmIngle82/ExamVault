'use client';

import { useEffect, useState } from 'react';
import { Download, ChevronLeft, Award, Clock, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Loader from '@/app/components/Loader';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

interface Submission {
    id: number;
    student_name: string;
    score: number;
    total_questions: number;
    submitted_at: string;
    violation_count: number;
    feedback?: Record<string, any>;
}

interface ResultsClientProps {
    id: string;
}

export default function ResultsClient({ id }: ResultsClientProps) {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [questionStats, setQuestionStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/tests/${id}/submissions`);
                if (!res.ok) {
                    const text = await res.text();
                    console.error('API Error Response:', text);
                    throw new Error(`API Error: ${res.status}`);
                }
                const data = await res.json();
                if (data.submissions) {
                    setSubmissions(data.submissions);
                }
                if (data.analytics) {
                    // Convert analytics dictionary to array for charts
                    // Sort by question ID or index if available, roughly using keys
                    const stats = Object.keys(data.analytics).map((key, idx) => ({
                        id: idx + 1,
                        ...data.analytics[key]
                    }));
                    setQuestionStats(stats);
                }
            } catch (error) {
                console.error('Failed to load results:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const downloadCSV = () => {
        const headers = ['Student Name', 'Score', 'Total Score', 'Time', 'Violations'];
        const rows = submissions.map(s => [
            s.student_name,
            s.score,
            s.total_questions,
            new Date(s.submitted_at).toLocaleString(),
            s.violation_count
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `results_test_${id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return <Loader fullScreen={true} />;
    }

    // --- ANALYTICS CALCULATIONS ---
    const totalSubmissions = submissions.length;
    let averageScore = 0;
    let highestScore = 0;
    let passCount = 0;

    // Score Distribution (Bins)
    const distribution = [
        { name: '0-20%', count: 0 },
        { name: '21-40%', count: 0 },
        { name: '41-60%', count: 0 },
        { name: '61-80%', count: 0 },
        { name: '81-100%', count: 0 },
    ];

    if (totalSubmissions > 0) {
        const totalPoints = submissions.reduce((acc, curr) => acc + curr.score, 0);
        averageScore = Math.round((totalPoints / totalSubmissions) * 10) / 10;
        highestScore = Math.max(...submissions.map(s => s.score));

        // Assume 50% is passing
        passCount = submissions.filter(s => (s.score / s.total_questions) >= 0.5).length;

        submissions.forEach(s => {
            const percentage = s.total_questions > 0 ? (s.score / s.total_questions) * 100 : 0;
            if (percentage <= 20) distribution[0].count++;
            else if (percentage <= 40) distribution[1].count++;
            else if (percentage <= 60) distribution[2].count++;
            else if (percentage <= 80) distribution[3].count++;
            else distribution[4].count++;
        });
    }

    const passFailData = [
        { name: 'Passed', value: passCount },
        { name: 'Failed', value: totalSubmissions - passCount },
    ];
    const COLORS = ['#10B981', '#EF4444'];

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/" style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: '#6B7280', textDecoration: 'none', fontWeight: 600
                    }}>
                        <ChevronLeft size={20} /> Back
                    </Link>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                        Test Analytics
                    </h1>
                </div>
                <button
                    onClick={downloadCSV}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: '#10B981', color: 'white', border: 'none',
                        padding: '0.75rem 1.25rem', borderRadius: '8px',
                        fontWeight: 600, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                    }}
                >
                    <Download size={18} /> Export Results
                </button>
            </div>

            {/* ERROR STATE */}
            {totalSubmissions === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📉</div>
                    <h3 style={{ fontSize: '1.5rem', color: '#374151' }}>No Data Available</h3>
                    <p style={{ color: '#6B7280' }}>Once students submit widespread results, analytics will appear here.</p>
                </div>
            ) : (
                <>
                    {/* STAT CARDS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6B7280', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                <TrendingUp size={16} /> Average Score
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>
                                {averageScore} <span style={{ fontSize: '1rem', color: '#9CA3AF', fontWeight: 600 }}>/ {submissions[0]?.total_questions}</span>
                            </div>
                        </div>

                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6B7280', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                <Award size={16} /> Highest Score
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>
                                {highestScore}
                            </div>
                        </div>

                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6B7280', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                <Target size={16} /> Pass Rate
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981' }}>
                                {Math.round((passCount / totalSubmissions) * 100)}%
                            </div>
                        </div>

                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6B7280', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                <Clock size={16} /> Submissions
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6366F1' }}>
                                {totalSubmissions}
                            </div>
                        </div>
                    </div>

                    {/* CHARTS ROW */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {/* SCORE DISTRIBUTION */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6', minHeight: '350px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem' }}>Score Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={distribution}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* PASS / FAIL RATIO */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6', minHeight: '350px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem' }}>Success Rate</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={passFailData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {passFailData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* QUESTION PERFORMANCE CHART */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem' }}>Question Performance</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={questionStats} layout="vertical" margin={{ left: 50, right: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#E5E7EB" />
                                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <YAxis dataKey="id" type="category" width={50} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    // @ts-ignore - Recharts type definition conflict fix
                                    formatter={(value: any) => [`${value}% Correct`, 'Success Rate']}
                                    labelFormatter={(label) => `Question ${label}`}
                                />
                                <Bar dataKey="percentage" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* DATA TABLE */}
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#374151' }}>Detailed Submissions</h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em' }}>Student Name</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em' }}>Score</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em' }}>Submitted At</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em' }}>AI Confidence</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((sub, idx) => (
                                    <tr key={sub.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#111827' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', background: '#E0F2FE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369A1', fontWeight: 700, fontSize: '0.8rem' }}>
                                                    {sub.student_name.charAt(0).toUpperCase()}
                                                </div>
                                                {sub.student_name}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                background: sub.score >= sub.total_questions * 0.7 ? '#ECFDF5' : '#FEF2F2',
                                                color: sub.score >= sub.total_questions * 0.7 ? '#059669' : '#DC2626',
                                                padding: '4px 10px', borderRadius: '20px', fontWeight: 700
                                            }}>
                                                {sub.score} / {sub.total_questions}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: '#6B7280', fontSize: '0.9rem' }}>
                                            {new Date(sub.submitted_at).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {(() => {
                                                const feedback = sub.feedback || {};
                                                const confidenceScores = Object.values(feedback)
                                                    .filter((f: any) => typeof f.confidence === 'number')
                                                    .map((f: any) => f.confidence);

                                                if (confidenceScores.length === 0) return <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>N/A (MCQ)</span>;

                                                const avg = Math.round(confidenceScores.reduce((a: number, b: number) => a + b, 0) / confidenceScores.length);
                                                return (
                                                    <span style={{
                                                        color: avg > 80 ? '#059669' : (avg > 50 ? '#D97706' : '#DC2626'),
                                                        fontWeight: 700, fontSize: '0.85rem'
                                                    }}>
                                                        🤖 {avg}%
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {sub.violation_count > 0 ? (
                                                <span style={{ color: '#D97706', fontSize: '0.85rem', fontWeight: 600 }}>
                                                    ⚠️ {sub.violation_count} Violations
                                                </span>
                                            ) : (
                                                <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
                                                    Clean Attempt
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
