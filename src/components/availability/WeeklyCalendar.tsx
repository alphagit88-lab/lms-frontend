'use client';

import { useMemo } from 'react';
import {
  AvailabilitySlot,
  getSlotStatusInfo,
  formatTimeRange,
  calculateDuration,
  getWeekDays,
} from '@/lib/api/availability';

interface WeeklyCalendarProps {
  weekStart: Date;
  slots: AvailabilitySlot[];
  onSlotClick: (slot: AvailabilitySlot) => void;
  onEmptyClick: (date: Date, hour: number) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0 AM to 11 PM

export default function WeeklyCalendar({
  weekStart,
  slots,
  onSlotClick,
  onEmptyClick,
  onPreviousWeek,
  onNextWeek,
}: WeeklyCalendarProps) {
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
      if (isNaN(d.getTime())) continue; // skip invalid dates
      const dateKey = toDateKey(d);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(slot);
    }
    return grouped;
  }, [slots]);

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

  // Get slots that fall within a given hour for a given date
  const getSlotsForHour = (date: Date, hour: number): AvailabilitySlot[] => {
    const dateKey = toDateKey(date);
    const daySlots = slotsByDate[dateKey] || [];
    return daySlots.filter((slot) => {
      const slotHour = new Date(slot.startTime).getHours();
      return slotHour === hour;
    });
  };

  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const year = start.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
  }, [weekDays]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <button
          onClick={onPreviousWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-900">{weekLabel}</h3>
        <button
          onClick={onNextWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200">
        <div className="p-2" /> {/* Time column header */}
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`p-3 text-center border-l border-gray-200 ${
              isToday(day)
                ? 'bg-black text-white'
                : isPast(day)
                ? 'bg-gray-50 text-gray-400'
                : 'text-gray-700'
            }`}
          >
            <div className="text-xs font-medium uppercase">
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className="text-lg font-bold mt-0.5">{day.getDate()}</div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="max-h-150 overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-100">
            {/* Time Label */}
            <div className="p-2 text-right pr-3 text-xs text-gray-500 font-medium pt-3">
              {hour === 0
                ? '12 AM'
                : hour === 12
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
                  className={`border-l border-gray-200 min-h-15 relative ${
                    past ? 'bg-gray-50' : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!past && hourSlots.length === 0) {
                      onEmptyClick(day, hour);
                    }
                  }}
                >
                  {hourSlots.map((slot) => {
                    const statusInfo = getSlotStatusInfo(slot);
                    const duration = calculateDuration(slot.startTime, slot.endTime);
                    const heightBlocks = Math.max(1, Math.ceil(duration / 60));

                    return (
                      <div
                        key={slot.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSlotClick(slot);
                        }}
                        className={`absolute inset-x-1 rounded-md p-1.5 cursor-pointer transition hover:opacity-90 z-10 border ${
                          slot.status === 'available'
                            ? 'bg-green-50 border-green-200 hover:bg-green-100'
                            : slot.status === 'booked'
                            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                            : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                        }`}
                        style={{
                          top: '2px',
                          height: `${heightBlocks * 60 - 6}px`,
                        }}
                      >
                        <div className="text-[11px] font-semibold text-gray-900 truncate">
                          {formatTimeRange(slot.startTime, slot.endTime)}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`}
                          />
                          <span className="text-[10px] text-gray-600">{statusInfo.label}</span>
                        </div>
                        {slot.price != null && slot.price > 0 && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            LKR {Number(slot.price).toLocaleString()}
                          </div>
                        )}
                        {slot.currentBookings > 0 && (
                          <div className="text-[10px] text-gray-500">
                            {slot.currentBookings}/{slot.maxBookings} booked
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
      <div className="px-6 py-3 border-t border-gray-200 flex items-center gap-6 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-200" />
          Available
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
          Booked
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
          Blocked
        </div>
        <div className="ml-auto text-gray-400">Click an empty cell to create a slot</div>
      </div>
    </div>
  );
}

