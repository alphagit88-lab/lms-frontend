'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import WeeklyCalendar from '@/components/availability/WeeklyCalendar';
import SlotList from '@/components/availability/SlotList';
import SlotModal from '@/components/availability/SlotModal';
import {
  AvailabilitySlot,
  CreateSlotData,
  getMySlots,
  createSlot,
  updateSlot,
  deleteSlot,
  blockSlot,
  getWeekStart,
} from '@/lib/api/availability';
import Link from 'next/link';

type ViewMode = 'calendar' | 'list';
type FilterStatus = 'all' | 'available' | 'booked' | 'blocked';

function InstructorAvailabilityContent() {
  const { user } = useAuth();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Data state
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [prefillDate, setPrefillDate] = useState<Date | null>(null);
  const [prefillHour, setPrefillHour] = useState<number | null>(null);

  // Stats
  const stats = {
    total: slots.length,
    available: slots.filter((s) => s.status === 'available').length,
    booked: slots.filter((s) => s.status === 'booked').length,
    blocked: slots.filter((s) => s.status === 'blocked').length,
  };

  // Load slots
  const loadSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // For calendar view, filter by week range
      const startDate = new Date(weekStart);
      const endDate = new Date(weekStart);
      endDate.setDate(endDate.getDate() + 7);

      const data = await getMySlots({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: filterStatus === 'all' ? undefined : filterStatus,
      });

      setSlots(data);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to load slots');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [weekStart, filterStatus]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

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

  // Modal handlers
  const openCreateModal = (date?: Date, hour?: number) => {
    setSelectedSlot(null);
    setPrefillDate(date || null);
    setPrefillHour(hour ?? null);
    setIsModalOpen(true);
  };

  const openEditModal = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    setPrefillDate(null);
    setPrefillHour(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    setPrefillDate(null);
    setPrefillHour(null);
  };

  // CRUD handlers
  const handleSave = async (data: CreateSlotData) => {
    await createSlot(data);
    await loadSlots();
  };

  const handleUpdate = async (id: string, data: Partial<CreateSlotData & { status: string }>) => {
    await updateSlot(id, data);
    await loadSlots();
  };

  const handleDelete = async (id: string) => {
    await deleteSlot(id);
    await loadSlots();
  };

  const handleBlock = async (id: string) => {
    await blockSlot(id);
    await loadSlots();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  My Availability
                </h1>
              </div>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage your schedule and available time slots for students
              </p>
            </div>
            <button
              onClick={() => openCreateModal()}
              className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium text-sm flex items-center gap-2 self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Slot
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">Total Slots</div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4">
            <div className="text-2xl font-bold text-green-700">{stats.available}</div>
            <div className="text-xs text-green-600 mt-1">Available</div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <div className="text-2xl font-bold text-blue-700">{stats.booked}</div>
            <div className="text-xs text-blue-600 mt-1">Booked</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-300 p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.blocked}</div>
            <div className="text-xs text-gray-500 mt-1">Blocked</div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          {/* Left: View toggle + Today */}
          <div className="flex items-center gap-2">
            <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 text-sm font-medium transition ${
                  viewMode === 'calendar'
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Today
            </button>
          </div>

          {/* Right: Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
            <button onClick={loadSlots} className="ml-auto text-sm font-medium underline">
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto"></div>
              <p className="mt-3 text-sm text-gray-500">Loading your schedule...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <WeeklyCalendar
                weekStart={weekStart}
                slots={slots}
                onSlotClick={openEditModal}
                onEmptyClick={openCreateModal}
                onPreviousWeek={goToPreviousWeek}
                onNextWeek={goToNextWeek}
              />
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <SlotList
                slots={slots}
                onSlotClick={openEditModal}
              />
            )}
          </>
        )}
      </div>

      {/* Slot Modal */}
      <SlotModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onBlock={handleBlock}
        slot={selectedSlot}
        prefillDate={prefillDate}
        prefillHour={prefillHour}
      />
    </div>
  );
}

export default function InstructorAvailabilityPage() {
  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <InstructorAvailabilityContent />
    </ProtectedRoute>
  );
}

