'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Booking,
  CancellationPolicy,
  getCancellationPolicy,
  cancelBooking,
} from '@/lib/api/bookings';
import { formatTimeRange, formatDate } from '@/lib/api/availability';

interface CancelBookingModalProps {
  booking: Booking;
  onClose: () => void;
  onCancelled: (booking: Booking) => void;
}

export default function CancelBookingModal({
  booking,
  onClose,
  onCancelled,
}: CancelBookingModalProps) {
  const [policy, setPolicy] = useState<CancellationPolicy | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [policyError, setPolicyError] = useState('');
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoadingPolicy(true);
        setPolicyError('');
        const data = await getCancellationPolicy(booking.id);
        setPolicy(data);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Failed to load cancellation policy');
        setPolicyError(error.message);
      } finally {
        setLoadingPolicy(false);
      }
    };
    fetchPolicy();
  }, [booking.id]);

  const handleCancel = async () => {
    try {
      setCancelling(true);
      setCancelError('');
      const response = await cancelBooking(booking.id, { reason: reason.trim() || undefined });
      onCancelled(response.booking);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to cancel booking');
      setCancelError(error.message);
    } finally {
      setCancelling(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Cancel Booking</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Booking summary */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Session</span>
              <span className="font-medium text-gray-900">{formatDate(booking.sessionStartTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time</span>
              <span className="text-gray-700">{formatTimeRange(booking.sessionStartTime, booking.sessionEndTime)}</span>
            </div>
            {booking.teacher && (
              <div className="flex justify-between">
                <span className="text-gray-500">Teacher</span>
                <span className="text-gray-700">{booking.teacher.firstName} {booking.teacher.lastName}</span>
              </div>
            )}
            {booking.amount != null && Number(booking.amount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-medium text-gray-900">LKR {Number(booking.amount).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Refund Policy */}
          {loadingPolicy ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Loading refund policy...</span>
            </div>
          ) : policyError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {policyError}
            </div>
          ) : policy ? (
            <div className={`rounded-lg border p-4 ${policy.refundPercentage === 100
                ? 'bg-green-50 border-green-200'
                : policy.refundPercentage === 50
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-red-50 border-red-200'
              }`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 ${policy.refundPercentage === 100
                    ? 'text-green-600'
                    : policy.refundPercentage === 50
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}>
                  {policy.refundPercentage === 100 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : policy.refundPercentage === 50 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-semibold ${policy.refundPercentage === 100
                      ? 'text-green-800'
                      : policy.refundPercentage === 50
                        ? 'text-amber-800'
                        : 'text-red-800'
                    }`}>
                    Refund Policy: {policy.refundPercentage}% Refund
                  </h4>
                  <p className={`text-xs mt-1 ${policy.refundPercentage === 100
                      ? 'text-green-700'
                      : policy.refundPercentage === 50
                        ? 'text-amber-700'
                        : 'text-red-700'
                    }`}>
                    {policy.policyDescription}
                  </p>
                  {policy.amount > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">
                        {policy.refundPercentage > 0
                          ? `Refund: LKR ${policy.refundAmount.toLocaleString()}`
                          : 'No refund will be issued'}
                      </span>
                      {policy.refundPercentage > 0 && policy.refundPercentage < 100 && (
                        <span className="text-xs ml-1 opacity-75">
                          (of LKR {policy.amount.toLocaleString()})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Policy breakdown */}
              <div className="mt-3 pt-3 border-t border-current/10 text-xs space-y-1 opacity-75">
                <div>24+ hours before: 100% refund</div>
                <div>6–24 hours before: 50% refund</div>
                <div>Less than 6 hours: No refund</div>
              </div>
            </div>
          ) : null}

          {/* Reason input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason for cancellation <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Schedule conflict, emergency..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none resize-none"
              disabled={cancelling}
            />
          </div>

          {/* Error */}
          {cancelError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
              {cancelError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={cancelling}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Keep Booking
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelling || loadingPolicy}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {cancelling ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Booking'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;

  return createPortal(modalContent, document.body);
}

