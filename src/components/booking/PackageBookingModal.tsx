'use client';

import { useState } from 'react';
import { AvailabilitySlot, formatTimeRange, formatDate, calculateDuration } from '@/lib/api/availability';
import { createPackageBooking, CreatePackageBookingResponse } from '@/lib/api/bookings';

interface PackageBookingModalProps {
  isOpen: boolean;
  slots: AvailabilitySlot[];
  teacherName: string;
  onClose: () => void;
  onSuccess: (response: CreatePackageBookingResponse) => void;
  onRemoveSlot: (slotId: string) => void;
}

export default function PackageBookingModal({
  isOpen,
  slots,
  teacherName,
  onClose,
  onSuccess,
  onRemoveSlot,
}: PackageBookingModalProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || slots.length === 0) return null;

  // Price calculations
  const totalPrice = slots.reduce((sum, s) => sum + (s.price ? Number(s.price) : 0), 0);
  const discountPercentage = slots.length >= 5 ? 10 : slots.length >= 3 ? 5 : 0;
  const finalPrice = Math.round(totalPrice * (1 - discountPercentage / 100) * 100) / 100;
  const savedAmount = Math.round((totalPrice - finalPrice) * 100) / 100;

  // Sort slots by date
  const sortedSlots = [...slots].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const handleConfirm = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await createPackageBooking({
        slotIds: slots.map((s) => s.id),
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess(response);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to create package booking');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl transform transition-all max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Book Session Package
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {slots.length} session{slots.length !== 1 ? 's' : ''} with {teacherName}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body — scrollable */}
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Discount Banner */}
            {discountPercentage > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    {discountPercentage}% Package Discount Applied!
                  </p>
                  <p className="text-xs text-green-600">
                    You save LKR {savedAmount.toLocaleString()} by booking {slots.length} sessions together
                  </p>
                </div>
              </div>
            )}

            {/* Discount Hint (below threshold) */}
            {discountPercentage === 0 && slots.length < 3 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Add {3 - slots.length} more session{3 - slots.length !== 1 ? 's' : ''} to get a <strong>5% discount</strong>!
                  Book 5+ sessions for <strong>10% off</strong>.
                </span>
              </div>
            )}

            {/* Title input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Title <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="e.g., Grade 11 Physics - Weekly Sessions"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                disabled={loading}
              />
            </div>

            {/* Selected Slots List */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Sessions ({slots.length})
              </label>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {sortedSlots.map((slot, index) => {
                  const duration = calculateDuration(slot.startTime, slot.endTime);
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {formatDate(slot.startTime)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTimeRange(slot.startTime, slot.endTime)}
                            <span className="text-gray-400 ml-1">({duration} min)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-700">
                          {slot.price != null && Number(slot.price) > 0
                            ? `LKR ${Number(slot.price).toLocaleString()}`
                            : 'Free'}
                        </span>
                        <button
                          onClick={() => onRemoveSlot(slot.id)}
                          disabled={loading}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
                          title="Remove from package"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes for teacher <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="e.g., Focus on mechanics and thermodynamics chapters..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none text-sm"
                disabled={loading}
              />
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{slots.length} session{slots.length !== 1 ? 's' : ''}</span>
                <span>LKR {totalPrice.toLocaleString()}</span>
              </div>
              {discountPercentage > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Package discount ({discountPercentage}%)</span>
                  <span>−LKR {savedAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="text-sm font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-green-700">
                  LKR {finalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || slots.length < 2}
              className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Package...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Book {slots.length} Sessions — LKR {finalPrice.toLocaleString()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

