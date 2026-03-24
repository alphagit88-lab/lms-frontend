'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import CancelBookingModal from '@/components/booking/CancelBookingModal';
import {
  Booking,
  getMyBookings,
  getBookingStatusInfo,
} from '@/lib/api/bookings';
import { formatTimeRange, formatDate, calculateDuration } from '@/lib/api/availability';

type TabId = 'upcoming' | 'past';

export default function StudentBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('upcoming');
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyBookings();
      setBookings(data);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to load bookings');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter((b) => {
          if (b.status === 'cancelled' || b.status === 'completed' || b.status === 'no_show') return false;
          return true;
        })
        .sort((a, b) => new Date(a.sessionStartTime).getTime() - new Date(b.sessionStartTime).getTime()),
    [bookings]
  );

  const pastBookings = useMemo(
    () =>
      bookings
        .filter((b) => {
          if (b.status === 'completed' || b.status === 'cancelled' || b.status === 'no_show') return true;
          return false;
        })
        .sort((a, b) => new Date(b.sessionStartTime).getTime() - new Date(a.sessionStartTime).getTime()),
    [bookings]
  );

  const currentBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const handleCancelled = (updated: Booking) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
    setCancellingBooking(null);

    const refundPct = updated.refundPercentage;
    const refundAmt = updated.refundAmount;
    if (refundPct != null && refundPct > 0 && refundAmt != null) {
      setSuccessMessage(`Booking cancelled. Refund of LKR ${Number(refundAmt).toLocaleString()} (${refundPct}%) will be processed.`);
    } else {
      setSuccessMessage('Booking cancelled successfully.');
    }
  };

  const canCancel = (booking: Booking) => {
    return booking.status === 'pending' || booking.status === 'confirmed';
  };

  const [syncingId, setSyncingId] = useState<string | null>(null);

  const syncPayment = async (bookingId: string) => {
    try {
      setSyncingId(bookingId);
      setError('');
      
      const API_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");
      const res = await fetch(`${API_URL}/api/bookings/${bookingId}/sync-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        // Refresh the list to show confirmed status
        const updatedBookings = await getMyBookings();
        setBookings(updatedBookings);
      } else {
        setError(data.message);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError('Failed to sync payment status. Please try again later.');
    } finally {
      setSyncingId(null);
    }
  };

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'upcoming', label: 'Upcoming', count: upcomingBookings.length },
    { id: 'past', label: 'History', count: pastBookings.length },
  ];

  return (
    <ProtectedRoute allowedRoles={['student', 'parent', 'admin']}>
      <AppLayout>
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
              <p className="text-sm text-slate-500 mt-1">View your sessions and manage bookings</p>
            </div>
            <Link
              href="/bookings/packages"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Session Packages
            </Link>
          </div>
        </div>

        {/* Success toast */}
        {successMessage && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition ${activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                  }`}>
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
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-3 text-sm text-slate-500">Loading bookings...</p>
            </div>
          </div>
        ) : currentBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              {activeTab === 'upcoming' ? 'No upcoming bookings' : 'No booking history'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {activeTab === 'upcoming'
                ? 'Browse teachers to book your first session'
                : 'Your completed and cancelled sessions will appear here'}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                href="/teachers"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Find a Teacher
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentBookings.map((booking) => {
              const statusInfo = getBookingStatusInfo(booking.status);
              const duration = calculateDuration(booking.sessionStartTime, booking.sessionEndTime);
              const teacherName = booking.teacher
                ? `${booking.teacher.firstName} ${booking.teacher.lastName}`
                : 'Teacher';
              const isToday = (() => {
                const sessionDate = new Date(booking.sessionStartTime);
                const today = new Date();
                return (
                  sessionDate.getDate() === today.getDate() &&
                  sessionDate.getMonth() === today.getMonth() &&
                  sessionDate.getFullYear() === today.getFullYear()
                );
              })();

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-xl border shadow-sm p-5 ${isToday && booking.status === 'confirmed'
                      ? 'border-emerald-300 ring-1 ring-emerald-100'
                      : booking.status === 'pending_payment'
                        ? 'border-purple-200'
                        : booking.status === 'pending'
                          ? 'border-amber-200'
                          : 'border-slate-200'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {booking.teacher
                            ? `${booking.teacher.firstName[0]}${booking.teacher.lastName[0]}`.toUpperCase()
                            : '??'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-900 truncate">{teacherName}</h4>
                          <p className="text-xs text-slate-400">{booking.teacher?.email || ''}</p>
                        </div>
                        <span className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {formatDate(booking.sessionStartTime)}
                            {isToday && (
                              <span className="ml-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Today</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatTimeRange(booking.sessionStartTime, booking.sessionEndTime)} <span className="text-slate-400">({duration} min)</span></span>
                        </div>
                        {booking.amount != null && Number(booking.amount) > 0 && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium text-emerald-700">LKR {Number(booking.amount).toLocaleString()}</span>
                          </div>
                        )}
                        {booking.meetingLink && booking.status === 'confirmed' && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                              Join Meeting
                            </a>
                          </div>
                        )}
                      </div>

                      {booking.notes && (
                        <div className="mt-3 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
                          <span className="font-medium text-slate-500 text-xs uppercase tracking-wide">Your Note:</span>
                          <p className="mt-0.5">{booking.notes}</p>
                        </div>
                      )}

                      {booking.status === 'pending_payment' && (
                        <div className="mt-3 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-sm text-purple-700">
                          <p className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Payment required to confirm this booking.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Link
                                href={`/payments/checkout?type=booking_session&referenceId=${booking.id}&amount=${booking.amount}&recipientId=${booking.teacherId}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Pay Now
                            </Link>

                            <button
                                onClick={() => syncPayment(booking.id)}
                                disabled={syncingId === booking.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition disabled:opacity-50"
                            >
                                <svg className={`w-3.5 h-3.5 ${syncingId === booking.id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {syncingId === booking.id ? 'Syncing...' : 'I\'ve Already Paid'}
                            </button>
                          </div>
                        </div>
                      )}

                      {booking.status === 'pending' && (
                        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm text-amber-700 flex items-center gap-2">
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Waiting for the instructor to approve your booking request.
                        </div>
                      )}

                      {booking.status === 'cancelled' && (
                        <div className="mt-3 space-y-2">
                          {booking.cancellationReason && (
                            <div className="bg-red-50 rounded-lg px-3 py-2 text-sm text-red-700">
                              <span className="font-medium text-xs uppercase tracking-wide">Cancellation Reason:</span>
                              <p className="mt-0.5">{booking.cancellationReason}</p>
                            </div>
                          )}
                          {booking.refundPercentage != null && (
                            <div className={`rounded-lg px-3 py-2 text-sm ${booking.refundPercentage === 100
                                ? 'bg-emerald-50 text-emerald-700'
                                : booking.refundPercentage > 0
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-50 text-slate-600'
                              }`}>
                              <span className="font-medium">
                                Refund: {booking.refundPercentage}%
                                {booking.refundAmount != null && Number(booking.refundAmount) > 0 && (
                                  <> — LKR {Number(booking.refundAmount).toLocaleString()}</>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {canCancel(booking) && (
                        <button
                          onClick={() => setCancellingBooking(booking)}
                          className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

        {cancellingBooking && (
          <CancelBookingModal
            booking={cancellingBooking}
            onClose={() => setCancellingBooking(null)}
            onCancelled={handleCancelled}
          />
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
