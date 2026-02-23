'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import BookingCard from '@/components/booking/BookingCard';
import { useAuth } from '@/contexts/AuthContext';
import {
  Booking,
  BookingStatus,
  getTeacherBookings,
  confirmBooking,
  cancelBooking,
  completeBooking,
  markNoShow,
} from '@/lib/api/bookings';
import {
  getMyTeacherProfile,
  updateTeacherProfile,
} from '@/lib/api/teachers';

type TabId = 'pending' | 'upcoming' | 'past';

export default function InstructorBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null); // booking ID being acted on
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-confirm state
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [autoConfirmLoading, setAutoConfirmLoading] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getTeacherBookings();
      setBookings(data);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to load bookings');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load teacher profile to get autoConfirm setting
  useEffect(() => {
    if (user?.id) {
      getMyTeacherProfile(user.id)
        .then((profile) => {
          setAutoConfirm(profile.autoConfirmBookings);
        })
        .catch(() => {
          // Profile may not exist yet — that's fine, default is false
        });
    }
  }, [user?.id]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ── Filter bookings into tabs ──
  const now = new Date();

  const pendingBookings = useMemo(
    () => bookings
      .filter((b) => b.status === 'pending')
      .sort((a, b) => new Date(a.sessionStartTime).getTime() - new Date(b.sessionStartTime).getTime()),
    [bookings]
  );

  const upcomingBookings = useMemo(
    () => bookings
      .filter((b) => b.status === 'confirmed' && new Date(b.sessionStartTime) >= new Date(new Date().setHours(0, 0, 0, 0)))
      .sort((a, b) => new Date(a.sessionStartTime).getTime() - new Date(b.sessionStartTime).getTime()),
    [bookings]
  );

  const pastBookings = useMemo(
    () => bookings
      .filter((b) => {
        if (b.status === 'completed' || b.status === 'cancelled' || b.status === 'no_show') return true;
        if (b.status === 'confirmed' && new Date(b.sessionEndTime) < now) return true;
        return false;
      })
      .sort((a, b) => new Date(b.sessionStartTime).getTime() - new Date(a.sessionStartTime).getTime()),
    [bookings]
  );

  const currentBookings = activeTab === 'pending' ? pendingBookings
    : activeTab === 'upcoming' ? upcomingBookings
    : pastBookings;

  // ── Actions ──

  const updateBookingInList = (updated: Booking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
    );
  };

  const handleConfirm = useCallback(async (id: string, meetingLink?: string) => {
    try {
      setActionLoading(id);
      const response = await confirmBooking(id, { meetingLink });
      updateBookingInList(response.booking);
      setSuccessMessage('Booking approved successfully!');
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to confirm booking');
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleCancel = useCallback(async (id: string, reason?: string) => {
    try {
      setActionLoading(id);
      const response = await cancelBooking(id, { reason });
      updateBookingInList(response.booking);
      setSuccessMessage('Booking cancelled.');
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to cancel booking');
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleComplete = useCallback(async (id: string) => {
    try {
      setActionLoading(id);
      const response = await completeBooking(id);
      updateBookingInList(response.booking);
      setSuccessMessage('Session marked as completed!');
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to complete booking');
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleNoShow = useCallback(async (id: string) => {
    try {
      setActionLoading(id);
      const response = await markNoShow(id);
      updateBookingInList(response.booking);
      setSuccessMessage('Booking marked as no-show.');
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to mark no-show');
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  }, []);

  // ── Auto-confirm toggle handler ──
  const handleAutoConfirmToggle = useCallback(async () => {
    try {
      setAutoConfirmLoading(true);
      const newValue = !autoConfirm;
      await updateTeacherProfile({ autoConfirmBookings: newValue });
      setAutoConfirm(newValue);
      setSuccessMessage(
        newValue
          ? 'Auto-confirm enabled — new bookings will be confirmed automatically'
          : 'Auto-confirm disabled — new bookings will require manual approval'
      );
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to update setting');
      setError(error.message);
    } finally {
      setAutoConfirmLoading(false);
    }
  }, [autoConfirm]);

  // ── Tab config ──
  const tabs: { id: TabId; label: string; count: number; icon: string }[] = [
    {
      id: 'pending',
      label: 'Pending Requests',
      count: pendingBookings.length,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      id: 'upcoming',
      label: 'Upcoming Sessions',
      count: upcomingBookings.length,
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      id: 'past',
      label: 'Past Sessions',
      count: pastBookings.length,
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <AppLayout>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manage Bookings</h1>
            <p className="text-sm text-slate-500 mt-1">Review requests, manage sessions, and track your teaching history</p>
          </div>

          {/* Auto-Confirm Toggle */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-700">Auto-Confirm</div>
              <div className="text-xs text-slate-400">
                {autoConfirm ? 'Bookings auto-approved' : 'Manual approval required'}
              </div>
            </div>
            <button
              onClick={handleAutoConfirmToggle}
              disabled={autoConfirmLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                autoConfirm ? 'bg-emerald-500' : 'bg-slate-300'
              } ${autoConfirmLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              role="switch"
              aria-checked={autoConfirm}
              aria-label="Toggle auto-confirm bookings"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  autoConfirm ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div>
          {/* Success toast */}
          {successMessage && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage('')} className="ml-auto text-emerald-500 hover:text-emerald-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {!loading && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">{pendingBookings.length}</div>
                <div className="text-xs text-slate-500 mt-0.5">Pending</div>
              </div>
              <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-emerald-700">{upcomingBookings.length}</div>
                <div className="text-xs text-slate-500 mt-0.5">Upcoming</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-slate-700">{pastBookings.length}</div>
                <div className="text-xs text-slate-500 mt-0.5">Past</div>
              </div>
            </div>
          )}

          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      activeTab === tab.id
                        ? tab.id === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : tab.id === 'upcoming'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-sm text-slate-500">Loading bookings...</p>
              </div>
            </div>
          ) : currentBookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {activeTab === 'pending' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                ) : activeTab === 'upcoming' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                {activeTab === 'pending'
                  ? 'No pending requests'
                  : activeTab === 'upcoming'
                  ? 'No upcoming sessions'
                  : 'No past sessions'}
              </h3>
              <p className="text-sm text-slate-500">
                {activeTab === 'pending'
                  ? 'New booking requests from students will appear here'
                  : activeTab === 'upcoming'
                  ? 'Approved sessions will appear here'
                  : 'Completed and cancelled sessions will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  onComplete={handleComplete}
                  onNoShow={handleNoShow}
                  loading={actionLoading === booking.id}
                />
              ))}
            </div>
          )}

          {!loading && (
            <div className="mt-6 text-center">
              <button
                onClick={loadBookings}
                className="text-sm text-slate-500 hover:text-slate-700 transition flex items-center gap-1.5 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

