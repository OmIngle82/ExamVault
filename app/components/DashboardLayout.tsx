'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import layoutStyles from './layout.module.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: 'admin' | 'student';
    username: string;
    onSearch?: (query: string) => void;
    fullName?: string;
    avatarUrl?: string;
}

export default function DashboardLayout({ children, role, username, onSearch, fullName, avatarUrl }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className={layoutStyles.container}>
            {/* Decorative Blob */}
            <div className="bg-blob" />

            <Sidebar
                role={role}
                username={username}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className={layoutStyles.mainContent}>
                <TopBar
                    username={username}
                    onSearch={onSearch}
                    fullName={fullName}
                    avatarUrl={avatarUrl}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
                <main>
                    {children}
                </main>
            </div>
        </div>
    );
}
