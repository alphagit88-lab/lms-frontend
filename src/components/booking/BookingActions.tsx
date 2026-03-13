'use client';

import { useState } from 'react';
import { Booking } from '@/lib/api/bookings';

interface BookingActionsProps {
  booking: Booking;
  isPast: boolean;
  isUpcoming: boolean;
  onConfirm: (id: string, meetingLink?: string) => void;
  onCancel: (id: string, reason?: string) => void;
  onComplete: (id: string) => void;
  onNoShow: (id: string) => void;
  loading?: boolean;
}

export default function BookingActions({
  booking,
  isPast,
  isUpcoming,
  onConfirm,
  onCancel,
  onComplete,
  onNoShow,
  loading = false,
}: BookingActionsProps) {
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [meetingLink, setMeetingLink] = useState(booking.meetingLink || '');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // ── Pending / Awaiting Payment: Approve / Reject ──
  if (booking.status === 'pending' || booking.status === 'pending_payment') {

    // For paid bookings awaiting payment, teacher cannot approve yet
    const isAwaitingPayment = booking.status === 'pending_payment';

    return (
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        {!showConfirmForm && !showCancelForm && (
          <>
            {isAwaitingPayment ? (
              /* Payment not yet received — show informational badge, not an approve button */
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-amber-800">Awaiting Payment</p>
                    <p className="text-xs text-amber-600">
                      {booking.amount ? `LKR ${Number(booking.amount).toFixed(2)} — ` : ''}
                      Approve will unlock once student pays
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* PENDING (payment done or free slot) — teacher can approve */
              <button
                onClick={() => setShowConfirmForm(true)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve
              </button>
            )}

            {/* Reject is always available (teacher can decline even unpaid bookings) */}
            <button
              onClick={() => setShowCancelForm(true)}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          </>
        )}

        {/* Approve form — optional meeting link (only shown for PENDING, not PENDING_PAYMENT) */}
        {showConfirmForm && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2 w-full sm:w-64">
            <label className="block text-xs font-medium text-green-800">
              Meeting Link <span className="text-green-500 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://zoom.us/j/..."
              className="w-full px-2.5 py-1.5 text-sm border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none bg-white"
              disabled={loading}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onConfirm(booking.id, meetingLink.trim() || undefined);
                  setShowConfirmForm(false);
                }}
                disabled={loading}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {loading ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Confirm'
                )}
              </button>
              <button
                onClick={() => {
                  setShowConfirmForm(false);
                  setMeetingLink(booking.meetingLink || '');
                }}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reject form — optional reason */}
        {showCancelForm && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2 w-full sm:w-64">
            <label className="block text-xs font-medium text-red-800">
              Reason <span className="text-red-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Schedule conflict..."
              rows={2}
              className="w-full px-2.5 py-1.5 text-sm border border-red-300 rounded-md focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none bg-white resize-none"
              disabled={loading}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onCancel(booking.id, cancelReason.trim() || undefined);
                  setShowCancelForm(false);
                }}
                disabled={loading}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {loading ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Reject'
                )}
              </button>
              <button
                onClick={() => {
                  setShowCancelForm(false);
                  setCancelReason('');
                }}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }


  // ── Confirmed & Upcoming: Cancel, (on session day: Complete / No-Show) ──
  if (booking.status === 'confirmed') {
    return (
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        {/* Show Complete / No-Show for past or today sessions */}
        {!isUpcoming && (
          <>
            <button
              onClick={() => onComplete(booking.id)}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark Complete
            </button>
            <button
              onClick={() => onNoShow(booking.id)}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              No-Show
            </button>
          </>
        )}

        {/* Cancel — available for upcoming confirmed sessions */}
        {!isPast && !showCancelForm && (
          <button
            onClick={() => setShowCancelForm(true)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel Session
          </button>
        )}

        {showCancelForm && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2 w-full sm:w-64">
            <label className="block text-xs font-medium text-red-800">
              Cancellation Reason <span className="text-red-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Emergency, reschedule needed..."
              rows={2}
              className="w-full px-2.5 py-1.5 text-sm border border-red-300 rounded-md focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none bg-white resize-none"
              disabled={loading}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onCancel(booking.id, cancelReason.trim() || undefined);
                  setShowCancelForm(false);
                }}
                disabled={loading}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  'Confirm Cancel'
                )}
              </button>
              <button
                onClick={() => {
                  setShowCancelForm(false);
                  setCancelReason('');
                }}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Completed / Cancelled / No-Show — no actions ──
  return null;
}

