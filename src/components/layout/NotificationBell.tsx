'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { notificationAPI, NotificationItem } from '@/lib/api/notifications';

const POLL_INTERVAL_MS = 30_000;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function typeIcon(type: NotificationItem['notificationType']) {
  switch (type) {
    case 'booking_confirmed': return '✅';
    case 'booking_cancelled': return '❌';
    case 'booking_reminder': return '⏰';
    case 'payment_success':  return '💳';
    case 'payment_failed':   return '⚠️';
    case 'grade_posted':     return '📋';
    case 'exam_scheduled':   return '📝';
    case 'course_enrolled':  return '🎓';
    case 'session_started':  return '🎥';
    default:                 return '🔔';
  }
}

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    try {
      const { count } = await notificationAPI.getUnreadCount();
      setUnread(count);
    } catch {
      // silently ignore — unauthenticated or backend down
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { notifications } = await notificationAPI.getNotifications(1, 5);
      setItems(notifications);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count
  useEffect(() => {
    fetchCount();
    const timer = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchCount]);

  // Fetch preview when opening
  useEffect(() => {
    if (open) fetchItems();
  }, [open, fetchItems]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id: string) => {
    await notificationAPI.markRead(id);
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead();
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none ring-2 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
                Loading…
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <span className="text-2xl mb-2">🔔</span>
                <span className="text-sm">No notifications yet</span>
              </div>
            )}
            {!loading && items.map(n => (
              <div
                key={n.id}
                className={`flex gap-3 px-4 py-3 border-b border-slate-50 transition-colors ${n.isRead ? 'bg-white' : 'bg-blue-50/40'}`}
              >
                <div className="text-lg mt-0.5 shrink-0">{typeIcon(n.notificationType)}</div>
                <div className="flex-1 min-w-0">
                  {n.actionUrl ? (
                    <Link
                      href={n.actionUrl}
                      onClick={() => { if (!n.isRead) handleMarkRead(n.id); setOpen(false); }}
                      className="block"
                    >
                      {n.title && (
                        <p className="text-[13px] font-semibold text-slate-900 leading-tight truncate">{n.title}</p>
                      )}
                      <p className="text-[12px] text-slate-500 leading-snug line-clamp-2">{n.message}</p>
                    </Link>
                  ) : (
                    <div onClick={() => { if (!n.isRead) handleMarkRead(n.id); }}>
                      {n.title && (
                        <p className="text-[13px] font-semibold text-slate-900 leading-tight truncate">{n.title}</p>
                      )}
                      <p className="text-[12px] text-slate-500 leading-snug line-clamp-2">{n.message}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.sentAt)}</p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    title="Mark as read"
                    className="shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500 hover:bg-blue-700 transition-colors"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
