'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { notificationAPI, NotificationItem } from '@/lib/api/notifications';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

function groupByDate(items: NotificationItem[]): { label: string; items: NotificationItem[] }[] {
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const groups: Record<string, NotificationItem[]> = {};
  for (const item of items) {
    const d = new Date(item.sentAt).toDateString();
    const label = d === todayStr ? 'Today' : d === yesterdayStr ? 'Yesterday' : 'Older';
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }

  const order = ['Today', 'Yesterday', 'Older'];
  return order.filter(l => groups[l]).map(l => ({ label: l, items: groups[l] }));
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async (p: number, reset = false) => {
    try {
    if (reset) { setLoading(true); } else { setLoadingMore(true); }
      setError('');
      const { notifications: items, pagination } = await notificationAPI.getNotifications(p, 20);
      setNotifications(prev => reset ? items : [...prev, ...items]);
      setHasMore(p < pagination.totalPages);
      setPage(p);
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(1, true);
    notificationAPI.getUnreadCount().then(({ count }) => setUnreadCount(count)).catch(() => {});
  }, [load]);

  const handleMarkRead = async (id: string) => {
    await notificationAPI.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id: string) => {
    const was = notifications.find(n => n.id === id);
    await notificationAPI.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (was && !was.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const grouped = groupByDate(notifications);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-slate-500 mt-1">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 rounded-xl hover:bg-blue-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3 mb-6 text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔔</div>
              <p className="text-lg font-semibold text-slate-700">No notifications yet</p>
              <p className="text-sm text-slate-400 mt-2">You&apos;re all caught up!</p>
            </div>
          )}

          {!loading && grouped.map(group => (
            <div key={group.label} className="mb-6">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                {group.label}
              </div>
              <div className="space-y-2">
                {group.items.map(n => (
                  <div
                    key={n.id}
                    className={`flex gap-4 p-4 rounded-2xl border transition-all ${
                      n.isRead
                        ? 'bg-white border-slate-100'
                        : 'bg-blue-50/50 border-blue-100'
                    }`}
                  >
                    <div className="text-xl shrink-0 mt-0.5">{typeIcon(n.notificationType)}</div>

                    <div className="flex-1 min-w-0">
                      {n.actionUrl ? (
                        <Link
                          href={n.actionUrl}
                          onClick={() => { if (!n.isRead) handleMarkRead(n.id); }}
                          className="block group"
                        >
                          {n.title && (
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                              {n.title}
                            </p>
                          )}
                          <p className="text-[13px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                        </Link>
                      ) : (
                        <div onClick={() => { if (!n.isRead) handleMarkRead(n.id); }} className="cursor-default">
                          {n.title && (
                            <p className="text-sm font-semibold text-slate-900 leading-tight">{n.title}</p>
                          )}
                          <p className="text-[13px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1.5">{timeAgo(n.sentAt)}</p>
                    </div>

                    <div className="flex items-start gap-2 shrink-0">
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          title="Mark as read"
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n.id)}
                        title="Delete"
                        className="text-slate-300 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {hasMore && !loading && (
            <div className="text-center mt-6">
              <button
                onClick={() => load(page + 1)}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
