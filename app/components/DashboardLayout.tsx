'use client';

import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: 'admin' | 'student';
    username: string;
    onSearch?: (query: string) => void;
    fullName?: string;
    avatarUrl?: string;
}

export default function DashboardLayout({ children, role, username, onSearch, fullName, avatarUrl }: DashboardLayoutProps) {
    return (
        <div style={{ minHeight: '100vh', position: 'relative' }}>
            {/* Decorative Blob */}
            <div className="bg-blob" />

            <Sidebar role={role} username={username} />

            {/* Main Content Area - Pushed right by sidebar width (280px + gap) */}
            <div style={{
                marginLeft: '300px',
                paddingRight: '2rem',
                paddingBottom: '2rem',
                maxWidth: '1600px' // Prevent stretching too wide 
            }}>
                <TopBar username={username} onSearch={onSearch} fullName={fullName} avatarUrl={avatarUrl} />
                <main>
                    {children}
                </main>
            </div>
        </div>
    );
}
