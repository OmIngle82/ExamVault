'use client';

import { Star } from 'lucide-react';
import Link from 'next/link';

interface FeaturedCardProps {
    role: 'admin' | 'student';
}

export default function FeaturedCard({ role }: FeaturedCardProps) {
    return (
        <div className="card" style={{
            background: '#F3E8FF', /* Light Purple bg */
            padding: '0',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            minHeight: '380px',
            position: 'relative'
        }}>
            {/* Geometric content mock */}
            <div style={{ height: '50%', background: 'white', position: 'relative', overflow: 'hidden' }}>
                {/* Abstract Geometric Shapes matching design */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: '#F5C563' }}></div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '100px', height: '100px', background: '#5D5FEF', borderTopLeftRadius: '100px' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(45deg)', width: '60px', height: '60px', border: '10px solid #5D5FEF' }}></div>
            </div>

            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.5rem', lineHeight: 1.2, marginBottom: '0.5rem' }}>
                    {role === 'admin' ? 'Create New Assessment' : 'Master React Tips & Tricks'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.5rem' }}>
                    {role === 'admin'
                        ? 'Design timed tests with varied question types.'
                        : 'Learn how to create beautiful interfaces.'}
                </p>

                <Link href={role === 'admin' ? '/admin/create' : '/'} style={{ marginTop: 'auto', fontWeight: 700, fontSize: '0.9rem', color: '#1F2937' }}>
                    {role === 'admin' ? 'Create Today!' : 'Enroll Today!'}
                </Link>

                {/* Avatars */}
                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ccc', marginLeft: i > 0 ? '-8px' : 0, border: '2px solid white' }} />
                        ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500 }}>+115</span>
                </div>
            </div>
        </div>
    );
}
