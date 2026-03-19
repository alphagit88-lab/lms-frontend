'use client';

import { useState } from 'react';
import { CreateRecurringData, RecurringResponse } from '@/lib/api/availability';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

interface RecurringScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRecurringData) => Promise<RecurringResponse>;
}

export default function RecurringScheduleModal({
  isOpen,
  onClose,
  onSubmit,
}: RecurringScheduleModalProps) {
  // Form state
  const [dayOfWeek, setDayOfWeek] = useState('monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [price, setPrice] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [maxBookings, setMaxBookings] = useState('1');
  const [notes, setNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RecurringResponse | null>(null);

  // Estimate how many slots will be created (uses startDate, allows past dates)
  const estimatedCount = (() => {
    if (!recurrenceEndDate || !startDate) return 0;
    const end = new Date(recurrenceEndDate);
    const from = new Date(startDate);
    from.setHours(0, 0, 0, 0);
    if (end < from) return 0;

    const dayIndex = DAYS_OF_WEEK.findIndex((d) => d.value === dayOfWeek);
    const jsDayIndex = dayIndex === 6 ? 0 : dayIndex + 1;

    const current = new Date(from);
    const currentJsDay = current.getDay();
    let daysUntil = jsDayIndex - currentJsDay;
    if (daysUntil < 0) daysUntil += 7;
    current.setDate(current.getDate() + daysUntil);

    let count = 0;
    while (current <= end) {
      count++;
      current.setDate(current.getDate() + 7);
    }
    return count;
  })();

  const resetForm = () => {
    setDayOfWeek('monday');
    setStartTime('09:00');
    setEndTime('10:00');
    setStartDate(new Date().toISOString().split('T')[0]);
    setRecurrenceEndDate('');
    setPrice('');
    setDiscountPercentage('');
    setMaxBookings('1');
    setNotes('');
    setError('');
    setResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    // Client-side validation
    if (!dayOfWeek) {
      setError('Please select a day of the week');
      return;
    }
    if (!startTime || !endTime) {
      setError('Start time and end time are required');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }
    if (!startDate) {
      setError('Start date is required');
      return;
    }
    if (!recurrenceEndDate) {
      setError('Repeat Until date is required');
      return;
    }
    if (new Date(recurrenceEndDate) < new Date(startDate)) {
      setError('Repeat Until must be on or after the Start From date');
      return;
    }

    if (discountPercentage && (parseFloat(discountPercentage) < 0 || parseFloat(discountPercentage) > 100)) {
      setError('Discount percentage must be between 0 and 100');
      return;
    }

    setLoading(true);
    try {
      const data: CreateRecurringData = {
        dayOfWeek,
        startTime,
        endTime,
        startDate,
        recurrenceEndDate,
        price: price ? parseFloat(price) : undefined,
        discountPercentage: discountPercentage ? parseFloat(discountPercentage) : undefined,
        maxBookings: parseInt(maxBookings) || 1,
        notes: notes || undefined,
      };

      const response = await onSubmit(data);
      setResult(response);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to create recurring slots');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Create Recurring Schedule
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Auto-generate weekly slots for a specific day
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Success Result */}
          {result ? (
            <div className="px-6 py-6">
              <div className="text-center mb-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {result.count} Slot{result.count !== 1 ? 's' : ''} Created!
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {result.message}
                </p>
              </div>

              {result.skippedDates.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="text-sm font-medium text-amber-800 mb-1">
                    Skipped Dates (overlapping with existing slots):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {result.skippedDates.map((d) => (
                      <span
                        key={d}
                        className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-mono"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400">Day:</span>{' '}
                    <span className="font-medium text-gray-900 capitalize">{dayOfWeek}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Time:</span>{' '}
                    <span className="font-medium text-gray-900">{startTime} - {endTime}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Until:</span>{' '}
                    <span className="font-medium text-gray-900">{recurrenceEndDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Slots:</span>{' '}
                    <span className="font-medium text-gray-900">{result.count}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setResult(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Create Another
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Form */
            <>
              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Day of Week */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => setDayOfWeek(day.value)}
                        className={`px-2 py-2 text-xs font-medium rounded-lg border transition ${
                          dayOfWeek === day.value
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {day.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start From
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        // Clear end date if it's before new start date
                        if (recurrenceEndDate && e.target.value > recurrenceEndDate) {
                          setRecurrenceEndDate('');
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repeat Until
                    </label>
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      min={startDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                    />
                    {recurrenceEndDate && estimatedCount > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        ≈ <span className="font-medium text-gray-700">{estimatedCount}</span> slot{estimatedCount !== 1 ? 's' : ''} (every{' '}
                        <span className="capitalize">{dayOfWeek}</span>)
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick presets for end date */}
                <div className="flex gap-2">
                  {[
                    { label: '4 weeks', weeks: 4 },
                    { label: '8 weeks', weeks: 8 },
                    { label: '12 weeks', weeks: 12 },
                    { label: '6 months', weeks: 26 },
                  ].map(({ label, weeks }) => {
                    const base = startDate ? new Date(startDate) : new Date();
                    base.setDate(base.getDate() + weeks * 7);
                    const dateStr = base.toISOString().split('T')[0];
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setRecurrenceEndDate(dateStr)}
                        className={`px-2.5 py-1 text-xs rounded-md border transition ${
                          recurrenceEndDate === dateStr
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                    />
                  </div>
                </div>



                {/* Price and Discount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Regular Price (LKR)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-xs">
                        LKR
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">
                      Discount Percentage (%)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-400 text-xs font-bold">
                        %
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(e.target.value)}
                        placeholder="0 - 100"
                        className="w-full pl-8 pr-3 py-2 border border-emerald-100 bg-emerald-50/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-emerald-900 placeholder:text-emerald-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Max Bookings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Students per Slot
                  </label>
                  <select
                    value={maxBookings}
                    onChange={(e) => setMaxBookings(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                  >
                    <option value="1">1 (One-on-one)</option>
                    <option value="2">2 students</option>
                    <option value="3">3 students</option>
                    <option value="5">5 students</option>
                    <option value="10">10 students</option>
                    <option value="20">20 students (group class)</option>
                    <option value="50">50 students (lecture)</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g., Grade 11 Physics, Topic: Mechanics"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none"
                  />
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !recurrenceEndDate || estimatedCount === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Create {estimatedCount > 0 ? `${estimatedCount} Slots` : 'Recurring Slots'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

