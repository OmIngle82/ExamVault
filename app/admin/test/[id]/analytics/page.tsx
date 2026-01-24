'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, ArrowLeft, TrendingUp, Users, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Unwrap params
    const [testId, setTestId] = useState<string>('');
    useEffect(() => {
        params.then(p => setTestId(p.id));
    }, [params]);

    useEffect(() => {
        if (!testId) return;
        fetch(`/api/tests/${testId}/analytics`)
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [testId]);

    const downloadCSV = () => {
        if (!data || !data.submissions) return;

        const headers = ['Student Name', 'Score', 'Total Questions', 'Date'];
        const rows = data.submissions.map((s: any) => [
            s.name,
            s.score,
            s.total,
            new Date(s.date).toLocaleString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map((e: any[]) => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${data.testTitle}_results.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Analytics...</div>;
    if (!data) return <div>Error loading data.</div>;
    if (data.error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {data.error}</div>;
    if (!data.stats) return <div>No statistics available.</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => router.back()} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><ArrowLeft /></button>
                    <div>
                        <h1 style={{ margin: 0 }}>Analytics: {data.testTitle}</h1>
                        <p style={{ color: '#666', margin: 0 }}>Insights and reporting</p>
                    </div>
                </div>
                <button
                    onClick={downloadCSV}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '0.75rem 1.5rem', background: '#10b981', color: 'white',
                        border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    <Download size={18} /> Export CSV
                </button>
            </div>

            {/* Key Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard icon={<Users color="#3b82f6" />} label="Total Attempts" value={data.stats.totalAttempts} />
                <StatCard icon={<TrendingUp color="#10b981" />} label="Avg Score" value={`${data.stats.average}`} />
                <StatCard icon={<CheckCircle color="#f59e0b" />} label="Median Score" value={data.stats.median} />
                <StatCard icon={<AlertTriangle color="#ef4444" />} label="Highest Score" value={data.stats.highest} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Chart Section */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ marginTop: 0 }}>Score Distribution</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Question Analysis */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', maxHeight: '400px', overflowY: 'auto' }}>
                    <h3 style={{ marginTop: 0 }}>Question Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {data.questionAnalysis.map((q: any) => (
                            <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Q{Number(q.id) + 1}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{q.prompt}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold', color: q.accuracy > 70 ? '#10b981' : (q.accuracy < 40 ? '#ef4444' : '#f59e0b') }}>
                                        {q.accuracy}%
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#999' }}>Accuracy</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Student Table */}
            <div style={{ marginTop: '2rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600 }}>
                    Detailed Results
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', textAlign: 'left', color: '#666', fontSize: '0.9rem' }}>
                            <th style={{ padding: '1rem' }}>Student Name</th>
                            <th style={{ padding: '1rem' }}>Score</th>
                            <th style={{ padding: '1rem' }}>Percentage</th>
                            <th style={{ padding: '1rem' }}>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.submissions.map((s: any) => (
                            <tr key={s.id} style={{ borderTop: '1px solid #eee' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{s.name}</td>
                                <td style={{ padding: '1rem' }}>{s.score} / {s.total}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ padding: '4px 8px', borderRadius: '12px', background: s.score / s.total >= 0.5 ? '#dcfce7' : '#fee2e2', color: s.score / s.total >= 0.5 ? '#166534' : '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>
                                        {Math.round((s.score / s.total) * 100)}%
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: '#666', fontSize: '0.9rem' }}>{new Date(s.date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: any, label: string, value: string | number }) {
    return (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: '50%' }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937' }}>{value}</div>
            </div>
        </div>
    );
}
