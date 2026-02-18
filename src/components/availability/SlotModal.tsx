'use client';

import { useState, useEffect } from 'react';
import { AvailabilitySlot, CreateSlotData, formatTimeRange, formatDate, getSlotStatusInfo } from '@/lib/api/availability';

interface SlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateSlotData) => Promise<void>;
  onUpdate: (id: string, data: Partial<CreateSlotData & { status: string }>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBlock: (id: string) => Promise<void>;
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
  const [maxBookings, setMaxBookings] = useState('1');
  const [notes, setNotes] = useState('');
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSaving(false);

    if (slot) {
      // Edit mode — populate from existing slot
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      setDate(start.toISOString().split('T')[0]);
      setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
      setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);
      setPrice(slot.price != null ? String(slot.price) : '');
      setMaxBookings(String(slot.maxBookings));
      setNotes(slot.notes || '');
    } else {
      // Create mode — prefill from calendar click
      if (prefillDate) {
        setDate(prefillDate.toISOString().split('T')[0]);
      } else {
        setDate(new Date().toISOString().split('T')[0]);
      }
      if (prefillHour != null) {
        setStartTime(`${String(prefillHour).padStart(2, '0')}:00`);
        setEndTime(`${String(prefillHour + 1).padStart(2, '0')}:00`);
      } else {
        setStartTime('09:00');
        setEndTime('10:00');
      }
      setPrice('');
      setMaxBookings('1');
      setNotes('');
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

    setSaving(true);
    try {
      if (isEdit && slot) {
        await onUpdate(slot.id, {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          price: price ? parseFloat(price) : undefined,
          notes: notes || undefined,
        });
      } else {
        await onSave({
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          price: price ? parseFloat(price) : undefined,
          maxBookings: parseInt(maxBookings) || 1,
          notes: notes || undefined,
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
    if (!confirm('Are you sure you want to delete this slot? This cannot be undone.')) return;

    setSaving(true);
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

    setSaving(true);
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

  if (!isOpen) return null;

  const hasBookings = slot && slot.currentBookings > 0;
  const statusInfo = slot ? getSlotStatusInfo(slot) : null;

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
              {isEdit && statusInfo && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              )}
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
                <div className="font-medium text-gray-900">
                  {formatDate(slot.startTime)}
                </div>
                <div className="text-gray-600">
                  {formatTimeRange(slot.startTime, slot.endTime)}
                </div>
                {hasBookings && (
                  <div className="mt-1 text-blue-600 font-medium">
                    {slot.currentBookings} booking{slot.currentBookings > 1 ? 's' : ''} on this slot
                  </div>
                )}
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
                disabled={isEdit && hasBookings}
                min={new Date().toISOString().split('T')[0]}
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
                  disabled={isEdit && hasBookings}
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
                  disabled={isEdit && hasBookings}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>

            {isEdit && hasBookings && (
              <p className="text-xs text-amber-600">
                Time cannot be changed because this slot has existing bookings.
              </p>
            )}

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (LKR)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
                  LKR
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00 (free)"
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Max Bookings (only for create) */}
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Students
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
            )}

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
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
            {/* Destructive actions (left side) */}
            {isEdit && (
              <div className="flex gap-2">
                {slot?.status !== 'blocked' && (
                  <button
                    type="button"
                    onClick={handleBlock}
                    disabled={loading}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    Block
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading || (hasBookings ?? false)}
                  className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                  title={hasBookings ? 'Cannot delete slot with active bookings' : 'Delete this slot'}
                >
                  Delete
                </button>
              </div>
            )}

            {/* Save actions (right side) */}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

