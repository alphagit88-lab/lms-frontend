'use client';

import {
  Booking,
  BookingStatus,
  getBookingStatusInfo,
} from '@/lib/api/bookings';
import { formatTimeRange, formatDate, calculateDuration } from '@/lib/api/availability';
import BookingActions from './BookingActions';

interface BookingCardProps {
  booking: Booking;
  onConfirm: (id: string, meetingLink?: string) => void;
  onCancel: (id: string, reason?: string) => void;
  onComplete: (id: string) => void;
  onNoShow: (id: string) => void;
  loading?: boolean;
}

export default function BookingCard({
  booking,
  onConfirm,
  onCancel,
  onComplete,
  onNoShow,
  loading = false,
}: BookingCardProps) {
  const statusInfo = getBookingStatusInfo(booking.status);
  const duration = calculateDuration(booking.sessionStartTime, booking.sessionEndTime);
  const studentName = booking.student
    ? `${booking.student.firstName} ${booking.student.lastName}`
    : 'Unknown Student';
  const studentEmail = booking.student?.email || '';

  const isPast = new Date(booking.sessionEndTime) < new Date();
  const isUpcoming = new Date(booking.sessionStartTime) > new Date();
  const isToday = (() => {
    const sessionDate = new Date(booking.sessionStartTime);
    const today = new Date();
    return (
      sessionDate.getDate() === today.getDate() &&
      sessionDate.getMonth() === today.getMonth() &&
      sessionDate.getFullYear() === today.getFullYear()
    );
  })();

  // Get initials for avatar
  const initials = booking.student
    ? `${booking.student.firstName[0]}${booking.student.lastName[0]}`.toUpperCase()
    : '??';

  return (
    <div
      className={`bg-white rounded-lg border p-4 sm:p-5 transition ${
        booking.status === 'pending'
          ? 'border-amber-200 shadow-sm'
          : booking.status === 'confirmed' && isToday
          ? 'border-green-300 shadow-sm ring-1 ring-green-100'
          : 'border-gray-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Left: Student Info + Session Details */}
        <div className="flex-1 min-w-0">
          {/* Student row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
              {booking.student?.profilePicture ? (
                <img
                  src={booking.student.profilePicture}
                  alt={studentName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{studentName}</h4>
              <p className="text-xs text-gray-400 truncate">{studentEmail}</p>
            </div>
            {/* Status badge */}
            <span
              className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
              {statusInfo.label}
            </span>
          </div>

          {/* Session details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {/* Date */}
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {formatDate(booking.sessionStartTime)}
                {isToday && (
                  <span className="ml-1.5 text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    Today
                  </span>
                )}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {formatTimeRange(booking.sessionStartTime, booking.sessionEndTime)}
                <span className="text-gray-400 ml-1">({duration} min)</span>
              </span>
            </div>

            {/* Amount */}
            {booking.amount != null && Number(booking.amount) > 0 && (
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-green-700">LKR {Number(booking.amount).toLocaleString()}</span>
              </div>
            )}

            {/* Meeting Link */}
            {booking.meetingLink && booking.status === 'confirmed' && (
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <a
                  href={booking.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  Join Meeting
                </a>
              </div>
            )}
          </div>

          {/* Student notes */}
          {booking.notes && (
            <div className="mt-3 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-600">
              <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">Student Note:</span>
              <p className="mt-0.5">{booking.notes}</p>
            </div>
          )}

          {/* Cancellation info */}
          {booking.status === 'cancelled' && booking.cancellationReason && (
            <div className="mt-3 bg-red-50 rounded-md px-3 py-2 text-sm text-red-700">
              <span className="font-medium text-xs uppercase tracking-wide">Cancellation Reason:</span>
              <p className="mt-0.5">{booking.cancellationReason}</p>
            </div>
          )}

          {/* Booking meta */}
          <div className="mt-3 text-xs text-gray-400">
            Booked {new Date(booking.bookingTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}ID: {booking.id.slice(0, 8)}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex-shrink-0 sm:w-auto">
          <BookingActions
            booking={booking}
            isPast={isPast}
            isUpcoming={isUpcoming}
            onConfirm={onConfirm}
            onCancel={onCancel}
            onComplete={onComplete}
            onNoShow={onNoShow}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

