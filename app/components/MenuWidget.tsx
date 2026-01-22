'use client';

import { Target, Calendar, Settings, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function MenuWidget() {
    const items = [
        { icon: Target, label: 'Goals', color: '#F2994A', bg: '#FEF3C7' },
        { icon: Calendar, label: 'Monthly Plan', color: '#5D5FEF', bg: '#E0E7FF' },
        { icon: Settings, label: 'Settings', color: '#56CCF2', bg: '#E0F2FE' },
    ];

    return (
        <div className="card" style={{ padding: '0.5rem' }}>
            {items.map((item, i) => (
                <Link
                    href="#"
                    key={i}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1rem', marginBottom: i === items.length - 1 ? 0 : '0.5rem',
                        borderRadius: '16px', transition: 'background 0.2s',
                        cursor: 'pointer'
                    }}
                    className="menu-item"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: item.bg, color: item.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <item.icon size={18} />
                        </div>
                        <span style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>{item.label}</span>
                    </div>

                    <div style={{
                        width: '24px', height: '24px', borderRadius: '50%', background: '#F3F4F6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ChevronRight size={14} color="#9CA3AF" />
                    </div>
                </Link>
            ))}
        </div>
    );
}
