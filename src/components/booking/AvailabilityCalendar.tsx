'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AvailabilitySlot,
  getTeacherSlots,
  formatTimeRange,
  calculateDuration,
  getWeekStart,
  getWeekDays,
} from '@/lib/api/availability';

interface AvailabilityCalendarProps {
  teacherId: string;
  onSlotSelect: (slot: AvailabilitySlot) => void;
  /** IDs of currently selected slots (for package mode visual feedback) */
  selectedSlotIds?: string[];
  /** When true, slots render with checkmark/selection styling */
  multiSelectMode?: boolean;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export default function AvailabilityCalendar({
  teacherId,
  onSlotSelect,
  selectedSlotIds = [],
  multiSelectMode = false,
}: AvailabilityCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // Local date key helper (avoids UTC shift from toISOString)
  const toDateKey = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Group slots by local date
  const slotsByDate = useMemo(() => {
    const grouped: Record<string, AvailabilitySlot[]> = {};
    for (const slot of slots) {
      const d = new Date(slot.startTime);
      if (isNaN(d.getTime())) continue;
      const dateKey = toDateKey(d);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(slot);
    }
    return grouped;
  }, [slots]);

  const loadSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const startDate = new Date(weekStart);
      const endDate = new Date(weekStart);
      endDate.setDate(endDate.getDate() + 7);

      const data = await getTeacherSlots(teacherId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      setSlots(data);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to load availability');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId, weekStart]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getSlotsForHour = (date: Date, hour: number): AvailabilitySlot[] => {
    const dateKey = toDateKey(date);
    const daySlots = slotsByDate[dateKey] || [];
    return daySlots.filter((slot) => {
      const slotHour = new Date(slot.startTime).getHours();
      return slotHour === hour;
    });
  };

  // Navigation
  const goToPreviousWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };

  const goToToday = () => {
    setWeekStart(getWeekStart(new Date()));
  };

  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const year = start.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${year}`;
    }
    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${year}`;
  }, [weekDays]);

  // Count available slots this week
  const availableCount = slots.length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-500">Loading availability...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-900">{weekLabel}</h3>
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="ml-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
          >
            Today
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {availableCount > 0 ? (
            <span className="text-green-700 font-medium">{availableCount} slot{availableCount !== 1 ? 's' : ''} available</span>
          ) : (
            <span className="text-gray-400">No slots this week</span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
          <span>{error}</span>
          <button onClick={loadSlots} className="ml-auto text-sm font-medium underline">Retry</button>
        </div>
      )}

      {/* Day Headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200">
        <div className="p-2" />
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`p-2 sm:p-3 text-center border-l border-gray-200 ${
              isToday(day)
                ? 'bg-green-600 text-white'
                : isPast(day)
                ? 'bg-gray-50 text-gray-400'
                : 'text-gray-700'
            }`}
          >
            <div className="text-[10px] sm:text-xs font-medium uppercase">
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className="text-base sm:text-lg font-bold mt-0.5">{day.getDate()}</div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="max-h-[500px] overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[80px_repeat(7,1fr)] border-b border-gray-100">
            {/* Time Label */}
            <div className="p-1 sm:p-2 text-right pr-2 sm:pr-3 text-[10px] sm:text-xs text-gray-500 font-medium pt-3">
              {hour === 12
                ? '12 PM'
                : hour > 12
                ? `${hour - 12} PM`
                : `${hour} AM`}
            </div>

            {/* Day Cells */}
            {weekDays.map((day, dayIndex) => {
              const hourSlots = getSlotsForHour(day, hour);
              const past = isPast(day);

              return (
                <div
                  key={dayIndex}
                  className={`border-l border-gray-200 min-h-[52px] sm:min-h-[60px] relative ${
                    past ? 'bg-gray-50/50' : ''
                  }`}
                >
                  {hourSlots.map((slot) => {
                    const duration = calculateDuration(slot.startTime, slot.endTime);
                    const heightBlocks = Math.max(1, Math.ceil(duration / 60));
                    const isHovered = hoveredSlot === slot.id;
                    const isSelected = multiSelectMode && selectedSlotIds.includes(slot.id);
                    const spotsLeft = slot.maxBookings - slot.currentBookings;

                    return (
                      <div
                        key={slot.id}
                        onClick={() => onSlotSelect(slot)}
                        onMouseEnter={() => setHoveredSlot(slot.id)}
                        onMouseLeave={() => setHoveredSlot(null)}
                        className={`absolute inset-x-0.5 sm:inset-x-1 rounded-md p-1 sm:p-1.5 cursor-pointer transition-all z-10 border ${
                          isSelected
                            ? 'bg-blue-100 border-blue-400 shadow-md ring-2 ring-blue-300'
                            : isHovered
                            ? 'bg-green-200 border-green-400 shadow-md scale-[1.02]'
                            : 'bg-green-50 border-green-200 hover:bg-green-100'
                        }`}
                        style={{
                          top: '2px',
                          height: `${heightBlocks * 60 - 6}px`,
                        }}
                      >
                        <div className="flex items-center gap-0.5">
                          {isSelected && (
                            <svg className="w-3 h-3 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className={`text-[10px] sm:text-[11px] font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-green-900'}`}>
                            {formatTimeRange(slot.startTime, slot.endTime)}
                          </span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 mt-0.5">
                          {slot.price != null && Number(slot.price) > 0 ? (
                            <span className="text-[10px] font-medium text-green-800">
                              LKR {Number(slot.price).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-green-700">Free</span>
                          )}
                        </div>
                        {spotsLeft > 0 && slot.maxBookings > 1 && (
                          <div className="text-[9px] sm:text-[10px] text-green-700 mt-0.5">
                            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                          </div>
                        )}

                        {/* Hover tooltip */}
                        {isHovered && (
                          <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50">
                            <div className="font-medium">{formatTimeRange(slot.startTime, slot.endTime)}</div>
                            <div className="text-gray-300">{duration} minutes</div>
                            {slot.price != null && Number(slot.price) > 0 && (
                              <div className="text-green-300">LKR {Number(slot.price).toLocaleString()}</div>
                            )}
                            <div className="text-gray-400 mt-0.5">
                              {multiSelectMode
                                ? isSelected ? 'Click to deselect' : 'Click to add to package'
                                : 'Click to book'}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-100 border border-green-200" />
            Available — click to book
          </div>
        </div>
        <span className="text-gray-400 hidden sm:inline">Hover for details</span>
      </div>
    </div>
  );
}

