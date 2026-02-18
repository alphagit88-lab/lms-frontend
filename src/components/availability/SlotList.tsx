'use client';

import {
  AvailabilitySlot,
  formatTimeRange,
  formatDate,
  calculateDuration,
  getSlotStatusInfo,
  isSlotPast,
} from '@/lib/api/availability';

interface SlotListProps {
  slots: AvailabilitySlot[];
  onSlotClick: (slot: AvailabilitySlot) => void;
}

export default function SlotList({ slots, onSlotClick }: SlotListProps) {
  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-4xl mb-3">📅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No slots found</h3>
        <p className="text-sm text-gray-600">
          Create your first availability slot using the calendar or the button above.
        </p>
      </div>
    );
  }

  // Group slots by date
  const groupedSlots: Record<string, AvailabilitySlot[]> = {};
  for (const slot of slots) {
    const dateKey = formatDate(slot.startTime);
    if (!groupedSlots[dateKey]) groupedSlots[dateKey] = [];
    groupedSlots[dateKey].push(slot);
  }

  // Sort each group by start time
  for (const key of Object.keys(groupedSlots)) {
    groupedSlots[key].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedSlots).map(([dateLabel, daySlots]) => (
        <div key={dateLabel} className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Date Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <h4 className="text-sm font-semibold text-gray-900">{dateLabel}</h4>
            <p className="text-xs text-gray-500">{daySlots.length} slot{daySlots.length > 1 ? 's' : ''}</p>
          </div>

          {/* Slot cards */}
          <div className="divide-y divide-gray-100">
            {daySlots.map((slot) => {
              const statusInfo = getSlotStatusInfo(slot);
              const duration = calculateDuration(slot.startTime, slot.endTime);
              const past = isSlotPast(slot);

              return (
                <div
                  key={slot.id}
                  onClick={() => onSlotClick(slot)}
                  className={`px-4 py-3 flex items-center gap-4 cursor-pointer transition ${
                    past
                      ? 'bg-gray-50 opacity-60'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Time */}
                  <div className="flex-shrink-0 w-36">
                    <div className="text-sm font-medium text-gray-900">
                      {formatTimeRange(slot.startTime, slot.endTime)}
                    </div>
                    <div className="text-xs text-gray-500">{duration} min</div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dotColor}`} />
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {slot.notes && (
                      <div className="text-sm text-gray-600 truncate">{slot.notes}</div>
                    )}
                    {slot.currentBookings > 0 && (
                      <div className="text-xs text-blue-600">
                        {slot.currentBookings}/{slot.maxBookings} booked
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0 text-right">
                    {slot.price != null && Number(slot.price) > 0 ? (
                      <div className="text-sm font-semibold text-gray-900">
                        LKR {Number(slot.price).toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">Free</div>
                    )}
                  </div>

                  {/* Arrow */}
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

