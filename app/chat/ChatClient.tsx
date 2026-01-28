'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Search, Send, User } from 'lucide-react';
import { useToast } from '@/app/context/ToastContext';
import styles from './chat.module.css';
import Modal from '../components/ui/Modal';

interface User {
    username: string;
    full_name?: string;
    avatar_url?: string;
}

interface Message {
    id: number;
    sender: string;
    receiver: string;
    content: string;
    timestamp: string;
}

interface ChatClientProps {
    currentUser: any;
}

export default function ChatClient({ currentUser }: ChatClientProps) {
    const { addToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [contacts, setContacts] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLiveMode, setIsLiveMode] = useState(true); // Default to Online
    const [showOfflineModal, setShowOfflineModal] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch Contacts
    const fetchContacts = async () => {
        try {
            const res = await fetch('/api/chat/contacts');
            if (res.ok) {
                const data = await res.json();
                setContacts(data.contacts || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchContacts();
    }, []);

    // Search Users
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchQuery.length > 0) {
                try {
                    const res = await fetch(`/api/users/search?q=${searchQuery}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSearchResults(data.users || []);
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    // Poll Messages
    useEffect(() => {
        if (!selectedUser) return;

        let isMounted = true;

        const fetchMessages = async () => {
            try {
                const url = `/api/chat/history?other_user=${selectedUser.username}`;
                const res = await fetch(url);
                if (res.ok && isMounted) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                }
            } catch (err) {
                console.error(err);
            }
        };

        // Always fetch once on selection
        fetchMessages();

        // Only start polling interval if Live Mode is ON
        if (isLiveMode) {
            const interval = setInterval(fetchMessages, 1000); // Live Polling: 1s
            return () => {
                isMounted = false;
                clearInterval(interval);
            };
        } else {
            return () => { isMounted = false; };
        }
    }, [selectedUser, isLiveMode]);

    // Smart Scroll to bottom
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        // Check if user is near bottom (within 150px) or if it's the first load
        const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 150;

        // Only scroll if they were already at the bottom, or if it's a fresh load
        if (isNearBottom) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, [messages]);

    const confirmLiveMode = () => {
        setIsLiveMode(true);
        addToast('You are now Online.', 'success');
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !selectedUser) return;

        // Auto-enable live mode if offline
        if (!isLiveMode) {
            setShowOfflineModal(true);
            return;
        }

        const tempMsg = newMessage;
        setNewMessage(''); // Clear input immediately

        // OPTIMISTIC UPDATE: Add to UI immediately
        const optimisticMsg: Message = {
            id: Date.now(), // Temp ID
            sender: currentUser.username,
            receiver: selectedUser.username,
            content: tempMsg,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: selectedUser.username, content: tempMsg })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server Error: ${res.status}`);
            }

            // Re-fetch to confirm and get real ID/timestamp
            const historyRes = await fetch(`/api/chat/history?other_user=${selectedUser.username}`);
            if (historyRes.ok) {
                const data = await historyRes.json();
                setMessages(data.messages || []);
            }

            fetchContacts();

        } catch (err: any) {
            console.error(err);
            addToast('Error sending message: ' + err.message, 'error');
            // Revert optimistic update
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setNewMessage(tempMsg); // Restore input
        }
    };

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Determine what list to show
    const showSearchResults = searchQuery.length > 0;
    const listToDisplay = showSearchResults ? searchResults : contacts;
    const listTitle = showSearchResults ? 'Search Results' : 'Recent Conversations';

    return (
        <DashboardLayout
            role={currentUser.role as 'admin' | 'student'}
            username={currentUser.username}
            fullName={currentUser.full_name}
            avatarUrl={currentUser.avatar_url}
        >
            <div className={styles.container}>

                {/* Sidebar: Contacts & Search */}
                <div className={styles.sidebar}>
                    {/* Live Mode Toggle Header */}
                    <div style={{ padding: '1rem', paddingBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Chats</h3>
                        <button
                            onClick={() => setIsLiveMode(!isLiveMode)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                background: isLiveMode ? '#ECFDF5' : '#F3F4F6',
                                color: isLiveMode ? '#059669' : '#6B7280',
                                border: isLiveMode ? '1px solid #A7F3D0' : '1px solid #E5E7EB',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isLiveMode ? '#10B981' : '#9CA3AF',
                                boxShadow: isLiveMode ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none'
                            }} />
                            {isLiveMode ? 'ONLINE' : 'OFFLINE'}
                        </button>
                    </div>

                    <div className={styles.searchBox}>
                        <Search size={18} color="#6B7280" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.userList}>
                        {listToDisplay.length > 0 ? (
                            <>
                                <h4 className={styles.listHeader}>{listTitle}</h4>
                                {listToDisplay.map(user => (
                                    <div key={user.username} onClick={() => handleSelectUser(user)} className={styles.userItem} style={{ background: selectedUser?.username === user.username ? '#E5E7EB' : 'transparent' }}>
                                        <img
                                            src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                            className={styles.avatar}
                                        />
                                        <div>
                                            <div className={styles.userName}>{user.full_name || user.username}</div>
                                            <div className={styles.userHandle}>@{user.username}</div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className={styles.emptyState}>
                                <p style={{ fontSize: '0.9rem', padding: '0 1rem' }}>
                                    {showSearchResults
                                        ? 'No users found.'
                                        : 'No recent conversations. Search for a user to start chatting.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={styles.chatArea}>
                    {selectedUser ? (
                        <>
                            <div className={styles.chatHeader}>
                                <img
                                    src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`}
                                    className={styles.headerAvatar}
                                />
                                <div>
                                    <h3 className={styles.headerName}>{selectedUser.full_name || selectedUser.username}</h3>
                                    {isLiveMode ? (
                                        <div className={styles.headerStatus} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', display: 'inline-block' }}></span>
                                            <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: '600' }}>Live</span>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: '500' }}>Last seen just now</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.messages} ref={scrollRef}>
                                {messages.length === 0 && (
                                    <div className={styles.noMessages}>
                                        <p>No messages with {selectedUser.full_name || selectedUser.username} yet.</p>
                                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Say hi! 👋</p>
                                    </div>
                                )}
                                {messages.map(msg => {
                                    const isMe = msg.sender === currentUser.username;
                                    return (
                                        <div key={msg.id} className={`${styles.messageBubble} ${isMe ? styles.sent : styles.received}`}>
                                            {msg.content}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={styles.inputArea}>
                                <input
                                    type="text"
                                    placeholder={isLiveMode ? "Type a message..." : "Go Online to chat"}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    className={styles.chatInput}
                                    disabled={!isLiveMode}
                                    style={{ opacity: isLiveMode ? 1 : 0.6 }}
                                />
                                <button onClick={handleSend} className={styles.sendBtn} style={{ opacity: isLiveMode ? 1 : 0.6, cursor: isLiveMode ? 'pointer' : 'not-allowed' }}>
                                    <Send size={20} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.welcomeState}>
                            <h1>Select a conversation</h1>
                            <p>Search for a friend or teacher to start chatting.</p>
                        </div>
                    )}
                </div>

                {/* Offline Confirmation Modal */}
                <Modal
                    isOpen={showOfflineModal}
                    onClose={() => setShowOfflineModal(false)}
                    title="You are Offline"
                    description="You are currently in offline mode. Do you want to go Online to send this message?"
                    confirmText="Go Online"
                    onConfirm={confirmLiveMode}
                />
            </div>
        </DashboardLayout>
    );
}
