'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import WeeklyCalendar from '@/components/availability/WeeklyCalendar';
import SlotList from '@/components/availability/SlotList';
import SlotModal from '@/components/availability/SlotModal';
import RecurringScheduleModal from '@/components/availability/RecurringScheduleModal';
import {
  AvailabilitySlot,
  CreateSlotData,
  UpdateSlotData,
  CreateRecurringData,
  RecurringResponse,
  getMySlots,
  createSlot,
  createRecurringSlots,
  updateSlot,
  deleteSlot,
  blockSlot,
  unblockSlot,
  cancelFutureRecurring,
  getWeekStart,
  formatTimeRange,
  formatDate,
  getSlotStatusInfo,
  calculateDuration,
} from '@/lib/api/availability';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';

type ViewMode = 'calendar' | 'list';
type FilterStatus = 'all' | 'available' | 'booked' | 'blocked';

function InstructorAvailabilityContent() {
  useAuth();

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
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
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

  const handleUpdate = async (id: string, data: UpdateSlotData) => {
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

  const handleUnblock = async (id: string) => {
    await unblockSlot(id);
    await loadSlots();
  };

  const handleCancelFutureRecurring = async (dayOfWeek: string) => {
    await cancelFutureRecurring({ dayOfWeek });
    await loadSlots();
  };

  const handleRecurringSubmit = async (data: CreateRecurringData): Promise<RecurringResponse> => {
    const response = await createRecurringSlots(data);
    await loadSlots();
    return response;
  };

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Availability</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your schedule and available time slots for students</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsRecurringModalOpen(true)}
            className="px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-sm flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recurring
          </button>
          <button
            onClick={() => openCreateModal()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Slot
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">Total Slots</div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-4">
          <div className="text-2xl font-bold text-emerald-700">{stats.available}</div>
          <div className="text-xs text-emerald-600 mt-1">Available</div>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-700">{stats.booked}</div>
          <div className="text-xs text-blue-600 mt-1">Booked</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-600">{stats.blocked}</div>
          <div className="text-xs text-slate-500 mt-1">Blocked</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm font-medium transition ${
                viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'
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
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'
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
            className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Filter:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{error}</span>
          <button onClick={loadSlots} className="ml-auto text-sm font-medium underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-slate-500">Loading your schedule...</p>
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

      {/* Slot Modal */}
      <SlotModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onCancelFutureRecurring={handleCancelFutureRecurring}
        slot={selectedSlot}
        prefillDate={prefillDate}
        prefillHour={prefillHour}
      />

      {/* Recurring Schedule Modal */}
      <RecurringScheduleModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onSubmit={handleRecurringSubmit}
      />
    </AppLayout>
  );
}

export default function InstructorAvailabilityPage() {
  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <InstructorAvailabilityContent />
    </ProtectedRoute>
  );
}

