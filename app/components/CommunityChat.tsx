'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, User } from 'lucide-react';
import { useToast } from '@/app/context/ToastContext';
import styles from './chat.module.css';

interface Message {
    id: number;
    content: string;
    username: string;
    created_at: string;
    avatar_url?: string;
}

export default function CommunityChat({ communityId, isActive }: { communityId: number, isActive: boolean }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    // Poll for messages
    useEffect(() => {
        if (!isActive) return;

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/communities/${communityId}/chat`);
                const data = await res.json();
                if (data.messages) {
                    setMessages(data.messages);
                }
            } catch (error) {
                console.error("Chat polling error", error);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // 3s polling
        return () => clearInterval(interval);
    }, [communityId, isActive]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch(`/api/communities/${communityId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: input })
            });

            if (res.ok) {
                setInput('');
                // Optimistic update or wait for poll
                const data = await res.json();
                if (data.message) {
                    setMessages(prev => [...prev, data.message]);
                }
            } else {
                addToast('Failed to send message', 'error');
            }
        } catch (error) {
            addToast('Error sending message', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={styles.chatContainer}>
            <div className={styles.messagesList}>
                {messages.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={styles.messageRow}>
                            <div className={styles.avatar}>
                                {msg.avatar_url ? (
                                    <img src={msg.avatar_url} alt={msg.username} />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>{msg.username[0].toUpperCase()}</div>
                                )}
                            </div>
                            <div className={styles.bubble}>
                                <div className={styles.sender}>{msg.username}</div>
                                <div className={styles.content}>{msg.content}</div>
                                <div className={styles.time}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className={styles.inputArea}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                />
                <button type="submit" disabled={sending || !input.trim()}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
