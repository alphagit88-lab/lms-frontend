'use client';

import { useState, useEffect } from 'react';
import { AvailabilitySlot, CreateSlotData, UpdateSlotData, formatTimeRange, formatDate, getSlotStatusInfo, calculateDuration } from '@/lib/api/availability';

interface SlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateSlotData) => Promise<void>;
  onUpdate: (id: string, data: UpdateSlotData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBlock: (id: string) => Promise<void>;
  onUnblock: (id: string) => Promise<void>;
  onCancelFutureRecurring?: (dayOfWeek: string) => Promise<void>;
  slot?: AvailabilitySlot | null;        // existing slot for edit mode
  prefillDate?: Date | null;             // date from calendar click
  prefillHour?: number | null;           // hour from calendar click
}

export default function SlotModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  onBlock,
  onUnblock,
  onCancelFutureRecurring,
  slot,
  prefillDate,
  prefillHour,
}: SlotModalProps) {
  const isEdit = !!slot;

  // Form state
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [price, setPrice] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [maxBookings, setMaxBookings] = useState('1');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [isCustomMaxBookings, setIsCustomMaxBookings] = useState(false);
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState<'block' | 'delete' | 'cancel-recurring' | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSaving(false);
    setConfirmAction(null);

    if (slot) {
      // Edit mode — populate from existing slot
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      const toDateKey = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setDate(toDateKey(start));
      setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
      setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);
      setPrice(slot.price != null ? String(slot.price) : '');
      setDiscountPercentage(slot.discountPercentage != null ? String(slot.discountPercentage) : '');
      setMaxBookings(String(slot.maxBookings));
      setNotes(slot.notes || '');
      setIsRecurring(!!slot.isRecurring);
      setRecurrenceEndDate(slot.recurrenceEndDate ? slot.recurrenceEndDate.split('T')[0] : '');
      
      const standardOptions = ['1', '2', '3', '5', '10', '20', '50'];
      const currentMax = String(slot.maxBookings);
      setMaxBookings(currentMax);
      setIsCustomMaxBookings(!standardOptions.includes(currentMax));
    } else {
      // Create mode — prefill from calendar click
      if (prefillDate) {
        const toDateKey = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setDate(toDateKey(prefillDate));
      } else {
        const now = new Date();
        const toDateKey = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setDate(toDateKey(now));
      }
      if (prefillHour != null) {
        setStartTime(`${String(prefillHour).padStart(2, '0')}:00`);
        setEndTime(`${String(Math.min(prefillHour + 1, 23)).padStart(2, '0')}:00`);
      } else {
        setStartTime('09:00');
        setEndTime('10:00');
      }
      setPrice('');
      setDiscountPercentage('');
      setMaxBookings('1');
      setNotes('');
      setIsRecurring(false);
      setRecurrenceEndDate('');
      setIsCustomMaxBookings(false);
    }
  }, [isOpen, slot, prefillDate, prefillHour]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!date || !startTime || !endTime) {
      setError('Date, start time, and end time are required');
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    if (endDateTime <= startDateTime) {
      setError('End time must be after start time');
      return;
    }

    if (!isEdit && startDateTime < new Date()) {
      setError('Cannot create slots in the past');
      return;
    }
    
    if (isRecurring && !recurrenceEndDate) {
      setError('Repeat Until date is required for recurring slots');
      return;
    }
    
    if (isRecurring && new Date(recurrenceEndDate) < startDateTime) {
      setError('Repeat Until date must be after the slot date');
      return;
    }

    if (discountPercentage && (parseFloat(discountPercentage) < 0 || parseFloat(discountPercentage) > 100)) {
      setError('Discount percentage must be between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && slot) {
        await onUpdate(slot.id, {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          price: price ? parseFloat(price) : undefined,
          discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
          maxBookings: parseInt(maxBookings) || 1,
          notes: notes || undefined,
          isRecurring,
          recurrenceEndDate: isRecurring ? recurrenceEndDate : undefined,
        });
      } else {
        await onSave({
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          price: price ? parseFloat(price) : undefined,
          discountPercentage: discountPercentage ? parseFloat(discountPercentage) : undefined,
          maxBookings: parseInt(maxBookings) || 1,
          notes: notes || undefined,
          isRecurring,
          recurrenceEndDate: isRecurring ? recurrenceEndDate : undefined,
        });
      }
      onClose();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to save slot');
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slot) return;

    // Require confirmation
    if (confirmAction !== 'delete') {
      setConfirmAction('delete');
      return;
    }

    setSaving(true);
    setConfirmAction(null);
    try {
      await onDelete(slot.id);
      onClose();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to delete slot');
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBlock = async () => {
    if (!slot) return;

    // Require confirmation if slot has bookings
    if (hasBookings && confirmAction !== 'block') {
      setConfirmAction('block');
      return;
    }

    setSaving(true);
    setConfirmAction(null);
    try {
      await onBlock(slot.id);
      onClose();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to block slot');
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async () => {
    if (!slot) return;

    setSaving(true);
    try {
      await onUnblock(slot.id);
      onClose();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to unblock slot');
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelFutureRecurring = async () => {
    if (!slot || !slot.isRecurring || !slot.dayOfWeek || !onCancelFutureRecurring) return;

    if (confirmAction !== 'cancel-recurring') {
      setConfirmAction('cancel-recurring');
      return;
    }

    setSaving(true);
    setConfirmAction(null);
    try {
      await onCancelFutureRecurring(slot.dayOfWeek);
      onClose();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to cancel recurring slots');
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const hasBookings = slot ? slot.currentBookings > 0 : false;
  const statusInfo = slot ? getSlotStatusInfo(slot) : null;
  const isBlocked = slot?.status === 'blocked';
  const isBooked = slot?.status === 'booked';
  const isPast = slot ? new Date(slot.endTime) < new Date() : false;
  const duration = slot ? calculateDuration(slot.startTime, slot.endTime) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isEdit ? 'Edit Availability Slot' : 'Create Availability Slot'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {isEdit && statusInfo && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                )}
                {slot?.isRecurring && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Recurring ({slot.dayOfWeek})
                  </span>
                )}
                {isPast && isEdit && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                    Overdue
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Confirmation Banner */}
          {confirmAction && (
            <div className={`px-6 py-3 text-sm ${
              confirmAction === 'delete' || confirmAction === 'cancel-recurring'
                ? 'bg-red-50 border-b border-red-200 text-red-800'
                : 'bg-amber-50 border-b border-amber-200 text-amber-800'
            }`}>
              {confirmAction === 'delete' && (
                <>
                  <p className="font-medium">Are you sure you want to delete this slot?</p>
                  <p className="text-xs mt-0.5 opacity-80">
                    {hasBookings
                      ? 'All existing bookings (confirmed and pending) will be cancelled. This cannot be undone.'
                      : 'This cannot be undone.'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition disabled:opacity-50"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition"
                    >
                      No, Keep It
                    </button>
                  </div>
                </>
              )}
              {confirmAction === 'block' && (
                <>
                  <p className="font-medium">Block this slot?</p>
                  <p className="text-xs mt-0.5 opacity-80">
                    This slot has {slot?.currentBookings} booking(s). Students will need to be notified.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleBlock}
                      disabled={loading}
                      className="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700 transition disabled:opacity-50"
                    >
                      Yes, Block
                    </button>
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded hover:bg-amber-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
              {confirmAction === 'cancel-recurring' && (
                <>
                  <p className="font-medium">Cancel all future {slot?.dayOfWeek} recurring slots?</p>
                  <p className="text-xs mt-0.5 opacity-80">
                    All future unbooked slots for this recurring pattern will be deleted. Slots with confirmed bookings will be preserved.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleCancelFutureRecurring}
                      disabled={loading}
                      className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition disabled:opacity-50"
                    >
                      Yes, Cancel All Future
                    </button>
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition"
                    >
                      No, Keep Them
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Existing slot info */}
            {isEdit && slot && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">
                    {formatDate(slot.startTime)}
                  </div>
                  <div className="text-xs text-gray-500">{duration} min</div>
                </div>
                <div className="text-gray-600">
                  {formatTimeRange(slot.startTime, slot.endTime)}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {hasBookings && (
                    <div className="text-blue-600 font-medium text-xs">
                      {slot.currentBookings}/{slot.maxBookings} booked
                    </div>
                  )}
                  {slot.price != null && Number(slot.price) > 0 && (
                    <div className="text-gray-500 line-through text-xs italic">
                      LKR {Number(slot.price).toLocaleString()}
                    </div>
                  )}
                  {slot.discountPercentage != null && Number(slot.discountPercentage) > 0 && (
                    <div className="text-green-700 font-bold text-xs">
                      PROMO: LKR {(Number(slot.price) * (1 - Number(slot.discountPercentage) / 100)).toLocaleString()} ({slot.discountPercentage}%)
                    </div>
                  )}
                  {slot.price != null && Number(slot.price) > 0 && !slot.discountPercentage && (
                    <div className="text-green-700 font-medium text-xs">
                      LKR {Number(slot.price).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={(isEdit && hasBookings && !isPast) || isBlocked}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-500"
              />
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
                  disabled={(isEdit && hasBookings && !isPast) || isBlocked}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-500"
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
                  disabled={(isEdit && hasBookings && !isPast) || isBlocked}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>

            {isEdit && hasBookings && !isPast && (
              <p className="text-xs text-amber-600">
                Time cannot be changed because this slot has existing bookings.
              </p>
            )}
            {isEdit && hasBookings && isPast && (
              <p className="text-xs text-blue-600 font-medium">
                Note: This is a past slot. You can edit the time to correct records.
              </p>
            )}

            {isEdit && isBlocked && !hasBookings && (
              <p className="text-xs text-gray-500">
                This slot is blocked. Unblock it to make changes.
              </p>
            )}

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
                    disabled={isBlocked}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-500 text-sm"
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
                    disabled={isBlocked}
                    className="w-full pl-8 pr-3 py-2 border border-emerald-100 bg-emerald-50/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-500 text-sm text-emerald-900 placeholder:text-emerald-300"
                  />
                </div>
              </div>
            </div>

            {/* Max Bookings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Students
              </label>
              <div className="space-y-3">
                <select
                  value={isCustomMaxBookings ? "custom" : maxBookings}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "custom") {
                      setIsCustomMaxBookings(true);
                      // Don't change maxBookings yet, keep previous
                    } else {
                      setIsCustomMaxBookings(false);
                      setMaxBookings(val);
                    }
                  }}
                  disabled={isBlocked}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="1">1 (One-on-one)</option>
                  <option value="2">2 students</option>
                  <option value="3">3 students</option>
                  <option value="5">5 students</option>
                  <option value="10">10 students</option>
                  <option value="20">20 students (group class)</option>
                  <option value="50">50 students (lecture)</option>
                  <option value="custom">Custom number...</option>
                </select>

                {isCustomMaxBookings && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={maxBookings}
                      onChange={(e) => setMaxBookings(e.target.value)}
                      placeholder="Enter student count"
                      disabled={isBlocked}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none disabled:bg-gray-100"
                    />
                    <span className="text-sm text-gray-500">students</span>
                  </div>
                )}
              </div>
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
                disabled={isBlocked}
                placeholder="e.g., Grade 11 Physics, Topic: Mechanics"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>

            {/* Recurring Option */}
            <div className="pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  disabled={isBlocked || (isEdit && slot?.isRecurring)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition">
                    Repeat Weekly
                  </span>
                  <span className="text-xs text-gray-500">
                    Auto-generate this slot for future weeks
                  </span>
                </div>
              </label>

              {isRecurring && (
                <div className="mt-3 pl-6 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="block text-xs font-medium text-gray-600">
                    Repeat Until
                  </label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    min={date}
                    disabled={isBlocked || (isEdit && slot?.isRecurring)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                  {isEdit && slot?.isRecurring && (
                    <p className="text-[10px] text-amber-600">
                      Note: You cannot change recurrence settings for an existing recurring slot here. Use &quot;Cancel All Future&quot; to remove them.
                    </p>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            {/* Action row */}
            <div className="flex items-center gap-3">
              {/* Left: destructive/status actions */}
              {isEdit && (
                <div className="flex flex-wrap gap-2">
                  {/* Block / Unblock toggle */}
                  {isBlocked ? (
                    <button
                      type="button"
                      onClick={handleUnblock}
                      disabled={loading || isPast}
                      className="px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                      title={isPast ? 'Cannot unblock a past slot' : 'Restore this slot to available'}
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBlock}
                      disabled={loading}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      Block
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                    title={hasBookings && isBooked ? 'Cannot delete slot with confirmed bookings' : 'Delete this slot'}
                  >
                    Delete
                  </button>

                  {/* Cancel all future recurring */}
                  {slot?.isRecurring && slot?.dayOfWeek && onCancelFutureRecurring && (
                    <button
                      type="button"
                      onClick={handleCancelFutureRecurring}
                      disabled={loading}
                      className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                      title={`Cancel all future ${slot.dayOfWeek} slots`}
                    >
                      Cancel All Future
                    </button>
                  )}
                </div>
              )}

              {/* Right: save actions */}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  {isEdit && isBlocked ? 'Close' : 'Cancel'}
                </button>
                {!(isEdit && isBlocked) && (
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {isEdit ? 'Update Slot' : 'Create Slot'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
