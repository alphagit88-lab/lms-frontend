'use client';

import { Booking, getBookingStatusInfo } from '@/lib/api/bookings';
import { formatTimeRange, formatDate, calculateDuration } from '@/lib/api/availability';

interface BookingSuccessProps {
  isOpen: boolean;
  booking: Booking;
  teacherName: string;
  onClose: () => void;
  onViewBookings: () => void;
}

export default function BookingSuccess({
  isOpen,
  booking,
  teacherName,
  onClose,
  onViewBookings,
}: BookingSuccessProps) {
  if (!isOpen) return null;

  const statusInfo = getBookingStatusInfo(booking.status);
  const duration = calculateDuration(booking.sessionStartTime, booking.sessionEndTime);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl transform transition-all">
          <div className="px-6 py-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Booking Created!
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Your session has been booked successfully
            </p>

            {/* Booking Details Card */}
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3 mb-6">
              {/* Booking ID */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Booking ID</span>
                <span className="font-mono">{booking.id.slice(0, 8)}...</span>
              </div>

              <div className="border-t border-gray-200" />

              {/* Teacher */}
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm text-gray-900 font-medium">{teacherName}</span>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="text-sm">
                  <span className="text-gray-900 font-medium">{formatDate(booking.sessionStartTime)}</span>
                  <span className="text-gray-400 mx-1">&middot;</span>
                  <span className="text-gray-600">
                    {formatTimeRange(booking.sessionStartTime, booking.sessionEndTime)}
                  </span>
                  <span className="text-gray-400 ml-1">({duration} min)</span>
                </div>
              </div>

              {/* Amount */}
              {booking.amount != null && Number(booking.amount) > 0 && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-green-700">
                    LKR {Number(booking.amount).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                <span className={`text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
                <span className="text-xs text-gray-400">— awaiting teacher confirmation</span>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="text-xs text-gray-500 italic border-t border-gray-200 pt-2">
                  Your note: &ldquo;{booking.notes}&rdquo;
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onViewBookings}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View My Bookings
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

