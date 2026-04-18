'use client';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Context for global notification state ──
const NotificationContext = createContext(null);

export function useNotification() {
    const ctx = useContext(NotificationContext);
    if (!ctx) return { notify: () => {} };
    return ctx;
}

// ── Notification Item ──
function NotificationItem({ notification, onDismiss }) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => onDismiss(notification.id), 300);
        }, 5000);
        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);

    return (
        <div
            className={cn(
                'flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-card transition-all duration-300 max-w-sm',
                exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0 animate-in slide-in-from-right-5'
            )}
        >
            <span className="text-2xl shrink-0">{notification.emoji}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                {notification.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{notification.description}</p>
                )}
            </div>
            <button
                onClick={() => { setExiting(true); setTimeout(() => onDismiss(notification.id), 300); }}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

// ── Provider Component ──
let notifIdCounter = 0;

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const notify = useCallback(({ title, description, emoji = '🔔' }) => {
        const id = ++notifIdCounter;
        setNotifications(prev => [...prev.slice(-4), { id, title, description, emoji }]);
    }, []);

    const dismiss = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            {/* Notification Stack */}
            {notifications.length > 0 && (
                <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                    {notifications.map(n => (
                        <div key={n.id} className="pointer-events-auto">
                            <NotificationItem notification={n} onDismiss={dismiss} />
                        </div>
                    ))}
                </div>
            )}
        </NotificationContext.Provider>
    );
}
