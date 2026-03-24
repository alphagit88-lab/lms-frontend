// API Configuration
const API_BASE_URL = typeof window !== "undefined" ? "/proxied-backend" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

// Types
export interface AvailabilitySlot {
  id: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  dayOfWeek?: string;
  recurrenceEndDate?: string;
  status: 'available' | 'booked' | 'blocked';
  maxBookings: number;
  currentBookings: number;
  price?: number;
  discountPercentage?: number | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  bookings?: Booking[];
}

export interface Booking {
  id: string;
  slotId: string;
  studentId: string;
  teacherId: string;
  bookedById: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  bookingTime: string;
  sessionStartTime: string;
  sessionEndTime: string;
  notes?: string;
  meetingLink?: string;
  amount?: number;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateSlotData {
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  dayOfWeek?: string;
  recurrenceEndDate?: string;
  price?: number;
  discountPercentage?: number | null;
  maxBookings?: number;
  notes?: string;
  targetTeacherId?: string;
}

export interface UpdateSlotData {
  startTime?: string;
  endTime?: string;
  price?: number;
  discountPercentage?: number | null;
  maxBookings?: number;
  notes?: string;
  status?: 'available' | 'booked' | 'blocked';
  isRecurring?: boolean;
  recurrenceEndDate?: string;
}

export interface CreateRecurringData {
  dayOfWeek: string;
  startTime: string;        // HH:mm format
  endTime: string;          // HH:mm format
  startDate?: string;       // YYYY-MM-DD — optional, defaults to today; can be past
  recurrenceEndDate: string; // YYYY-MM-DD
  price?: number;
  discountPercentage?: number | null;
  maxBookings?: number;
  notes?: string;
  targetTeacherId?: string;
}

export interface RecurringResponse {
  message: string;
  slots: AvailabilitySlot[];
  count: number;
  skippedDates: string[];
}

// Helper
async function apiFetch(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const err = Object.assign(new Error(data.error || 'An error occurred'), { status: response.status });
    throw err;
  }

  return data;
}

// ─── Teacher Slot Management ─────────────────────────────────────────

/**
 * Create a new availability slot (Teacher only)
 */
export async function createSlot(slotData: CreateSlotData): Promise<AvailabilitySlot> {
  const data = await apiFetch('/api/availability/slots', {
    method: 'POST',
    body: JSON.stringify(slotData),
  });
  return data.slot;
}

/**
 * Get teacher's own slots with optional filters
 */
export interface getMySlotsFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  teacherId?: string;
}

export async function getMySlots(filters?: getMySlotsFilters): Promise<AvailabilitySlot[]> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.teacherId) params.append('teacherId', filters.teacherId);

  const query = params.toString() ? `?${params}` : '';
  const data = await apiFetch(`/api/availability/slots/my${query}`);
  return data.slots;
}

/**
 * Update an availability slot (Teacher only)
 */
export async function updateSlot(id: string, slotData: UpdateSlotData): Promise<AvailabilitySlot> {
  const data = await apiFetch(`/api/availability/slots/${id}`, {
    method: 'PUT',
    body: JSON.stringify(slotData),
  });
  return data.slot;
}

/**
 * Delete an availability slot (Teacher only)
 */
export async function deleteSlot(id: string): Promise<void> {
  await apiFetch(`/api/availability/slots/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Block a slot (Teacher only)
 */
export async function blockSlot(id: string): Promise<AvailabilitySlot> {
  const data = await apiFetch(`/api/availability/slots/${id}/block`, {
    method: 'POST',
  });
  return data.slot;
}

/**
 * Unblock a blocked slot (Teacher only)
 */
export async function unblockSlot(id: string): Promise<AvailabilitySlot> {
  const data = await apiFetch(`/api/availability/slots/${id}/unblock`, {
    method: 'POST',
  });
  return data.slot;
}

/**
 * Create recurring availability slots (Teacher only)
 */
export async function createRecurringSlots(data: CreateRecurringData): Promise<RecurringResponse> {
  return apiFetch('/api/availability/recurring', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Cancel all future unbooked recurring slots matching a pattern (Teacher only)
 */
export async function cancelFutureRecurring(params: {
  dayOfWeek: string;
  startTime?: string;
  endTime?: string;
  teacherId?: string;
}): Promise<{ message: string; deletedCount: number; protectedSlots: { id: string; date: string; bookings: number }[] }> {
  return apiFetch('/api/availability/recurring/cancel', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ─── Public (Student-facing) ─────────────────────────────────────────

/**
 * Get a teacher's available slots (Public)
 */
export async function getTeacherSlots(
  teacherId: string,
  filters?: { startDate?: string; endDate?: string }
): Promise<AvailabilitySlot[]> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const query = params.toString() ? `?${params}` : '';
  const data = await apiFetch(`/api/availability/slots/teacher/${teacherId}${query}`);
  return data.slots;
}

/**
 * Get weekly availability for a teacher
 */
export async function getWeeklyAvailability(
  teacherId: string,
  startDate?: string
): Promise<{ slots: AvailabilitySlot[]; startDate: string; endDate: string }> {
  const params = startDate ? `?startDate=${startDate}` : '';
  return apiFetch(`/api/availability/weekly/${teacherId}${params}`);
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Get status badge info for a slot
 */
export function getSlotStatusInfo(slot: AvailabilitySlot) {
  switch (slot.status) {
    case 'available':
      return { label: 'Available', color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' };
    case 'booked':
      return { label: 'Booked', color: 'bg-blue-100 text-blue-800', dotColor: 'bg-blue-500' };
    case 'blocked':
      return { label: 'Blocked', color: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-500' };
    default:
      return { label: slot.status, color: 'bg-gray-100 text-gray-600', dotColor: 'bg-gray-400' };
  }
}

/**
 * Format a time range for display
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const timeFormat: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
  return `${start.toLocaleTimeString('en-US', timeFormat)} - ${end.toLocaleTimeString('en-US', timeFormat)}`;
}

/**
 * Format a date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Calculate duration in minutes between two times
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.round((end - start) / (1000 * 60));
}

/**
 * Check if a slot is in the past
 */
export function isSlotPast(slot: AvailabilitySlot): boolean {
  return new Date(slot.endTime) < new Date();
}

/**
 * Get start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get array of 7 dates starting from a given date
 */
export function getWeekDays(startDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
}

