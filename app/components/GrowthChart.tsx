'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

export default function GrowthChart({ username }: { username: string }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/analytics/student/growth?username=${username}`)
            .then(res => res.json())
            .then(json => {
                if (json.growth) setData(json.growth);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [username]);

    if (loading) return <div style={{ height: '200px', background: '#f9fafb', borderRadius: '12px', animation: 'pulse 2s infinite' }} />;
    if (data.length === 0) return <p style={{ fontSize: '0.9rem', color: '#888' }}>No data yet. Take a test!</p>;

    return (
        <div style={{ width: '100%', height: 200, marginLeft: '-20px' }}>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
