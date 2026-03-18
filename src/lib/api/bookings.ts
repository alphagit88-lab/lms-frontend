// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Types (aligned with Booking entity schema) ─────────────────────

export type BookingStatus = 'pending' | 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface BookingUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

export interface BookingSlot {
  id: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  status: string;
  maxBookings: number;
  currentBookings: number;
  price?: number;
  notes?: string;
}

export interface Booking {
  id: string;
  slotId: string;
  studentId: string;
  teacherId: string;
  bookedById: string;
  status: BookingStatus;
  bookingTime: string;
  sessionStartTime: string;
  sessionEndTime: string;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledById?: string;
  meetingLink?: string;
  reminderSent: boolean;
  amount?: number;
  paymentId?: string;
  refundPercentage?: number;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  packageId?: string;
  // Relations (populated when API includes them)
  slot?: BookingSlot;
  student?: BookingUser;
  teacher?: BookingUser;
  bookedBy?: BookingUser;
}

export type PackageStatus = 'active' | 'completed' | 'cancelled';

export interface BookingPackage {
  id: string;
  teacherId: string;
  studentId: string;
  bookedById: string;
  title?: string;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalPrice: number;
  discountPercentage: number;
  finalPrice: number;
  notes?: string;
  status: PackageStatus;
  createdAt: string;
  updatedAt: string;
  // Relations
  teacher?: BookingUser;
  student?: BookingUser;
}

export interface CreatePackageBookingData {
  slotIds: string[];
  studentId?: string;
  title?: string;
  notes?: string;
}

export interface CreatePackageBookingResponse {
  message: string;
  package: BookingPackage;
  bookings: Booking[];
  discount: {
    percentage: number;
    saved: number;
  };
  autoConfirmed: boolean;
}

export interface CancellationPolicy {
  bookingId: string;
  sessionStartTime: string;
  amount: number;
  refundPercentage: number;
  refundAmount: number;
  cancelledByTeacher: boolean;
  hoursBeforeSession: number;
  policyDescription: string;
}

export interface CancelBookingResponse {
  message: string;
  booking: Booking;
  refundPolicy: {
    percentage: number;
    amount: number;
    cancelledByTeacher: boolean;
    hoursBeforeSession: number;
  };
}

export interface CreateBookingData {
  slotId: string;
  studentId?: string;  // Required if parent is booking
  notes?: string;
}

export interface CreateBookingResponse {
  message: string;
  booking: Booking;
}

export interface CancelBookingData {
  reason?: string;
}

// ─── Helper ─────────────────────────────────────────────────────────

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
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}

// ─── API Functions ──────────────────────────────────────────────────

/**
 * Create a new booking (Student or Parent)
 * POST /api/bookings
 */
export async function createBooking(data: CreateBookingData): Promise<CreateBookingResponse> {
  return apiFetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get current user's bookings
 * GET /api/bookings/my
 */
export async function getMyBookings(filters?: {
  status?: BookingStatus;
  upcoming?: boolean;
}): Promise<Booking[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.upcoming) params.append('upcoming', 'true');

  const query = params.toString() ? `?${params}` : '';
  const data = await apiFetch(`/api/bookings/my${query}`);
  return data.bookings;
}

/**
 * Preview cancellation refund policy before cancelling
 * GET /api/bookings/:id/cancellation-policy
 */
export async function getCancellationPolicy(id: string): Promise<CancellationPolicy> {
  return apiFetch(`/api/bookings/${id}/cancellation-policy`);
}

/**
 * Cancel a booking (with refund policy applied)
 * PUT /api/bookings/:id/cancel
 */
export async function cancelBooking(id: string, data?: CancelBookingData): Promise<CancelBookingResponse> {
  return apiFetch(`/api/bookings/${id}/cancel`, {
    method: 'PUT',
    body: JSON.stringify(data || {}),
  });
}

// ─── Teacher API Functions ───────────────────────────────────────────

/**
 * Get teacher's bookings (Instructor only)
 * GET /api/bookings/teacher
 */
export async function getTeacherBookings(filters?: {
  status?: BookingStatus;
  date?: string; // YYYY-MM-DD
  teacherId?: string;
}): Promise<Booking[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.date) params.append('date', filters.date);
  if (filters?.teacherId) params.append('teacherId', filters.teacherId);

  const query = params.toString() ? `?${params}` : '';
  const data = await apiFetch(`/api/bookings/teacher${query}`);
  return data.bookings;
}

/**
 * Confirm a pending booking (Instructor only)
 * PUT /api/bookings/:id/confirm
 */
export async function confirmBooking(id: string, data?: {
  meetingLink?: string;
}): Promise<{ message: string; booking: Booking }> {
  return apiFetch(`/api/bookings/${id}/confirm`, {
    method: 'PUT',
    body: JSON.stringify(data || {}),
  });
}

/**
 * Mark a booking as completed (Instructor only)
 * PUT /api/bookings/:id/complete
 */
export async function completeBooking(id: string): Promise<{ message: string; booking: Booking }> {
  return apiFetch(`/api/bookings/${id}/complete`, {
    method: 'PUT',
    body: JSON.stringify({}),
  });
}

/**
 * Mark a booking as no-show (Instructor only)
 * PUT /api/bookings/:id/no-show
 */
export async function markNoShow(id: string): Promise<{ message: string; booking: Booking }> {
  return apiFetch(`/api/bookings/${id}/no-show`, {
    method: 'PUT',
    body: JSON.stringify({}),
  });
}

// ─── Package Booking API ────────────────────────────────────────────

/**
 * Create a multi-session package booking
 * POST /api/bookings/package
 */
export async function createPackageBooking(
  data: CreatePackageBookingData
): Promise<CreatePackageBookingResponse> {
  return apiFetch('/api/bookings/package', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get user's packages (Student or Teacher)
 * GET /api/bookings/packages
 */
export async function getMyPackages(filters?: {
  status?: PackageStatus;
}): Promise<BookingPackage[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);

  const query = params.toString() ? `?${params}` : '';
  const data = await apiFetch(`/api/bookings/packages${query}`);
  return data.packages;
}

/**
 * Get package details with bookings
 * GET /api/bookings/packages/:id
 */
export async function getPackageById(id: string): Promise<{
  package: BookingPackage;
  bookings: Booking[];
}> {
  return apiFetch(`/api/bookings/packages/${id}`);
}

/**
 * Remove a session from a package
 * POST /api/bookings/packages/:id/remove-session/:bookingId
 */
export async function removeSessionFromPackage(packageId: string, bookingId: string): Promise<{
    message: string;
    package: BookingPackage;
    remainingBookings: Booking[];
}> {
    return apiFetch(`/api/bookings/packages/${packageId}/remove-session/${bookingId}`, {
        method: 'POST'
    });
}

// ─── Display Helpers ────────────────────────────────────────────────

/**
 * Get refund policy tier info for display
 */
export function getRefundPolicyTier(hoursBeforeSession: number, cancelledByTeacher: boolean): {
  percentage: number;
  label: string;
  color: string;
} {
  if (cancelledByTeacher) {
    return { percentage: 100, label: '100% refund (teacher-initiated)', color: 'text-green-700' };
  }
  if (hoursBeforeSession >= 24) {
    return { percentage: 100, label: '100% refund', color: 'text-green-700' };
  }
  if (hoursBeforeSession >= 6) {
    return { percentage: 50, label: '50% refund', color: 'text-amber-700' };
  }
  return { percentage: 0, label: 'No refund', color: 'text-red-700' };
}

/**
 * Get human-readable status label and color
 */
export function getBookingStatusInfo(status: BookingStatus): {
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
} {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: 'text-amber-800', bgColor: 'bg-amber-50 border-amber-200', dotColor: 'bg-amber-500' };
    case 'pending_payment':
      return { label: 'Awaiting Payment', color: 'text-purple-800', bgColor: 'bg-purple-50 border-purple-200', dotColor: 'bg-purple-500' };
    case 'confirmed':
      return { label: 'Confirmed', color: 'text-green-800', bgColor: 'bg-green-50 border-green-200', dotColor: 'bg-green-500' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'text-red-800', bgColor: 'bg-red-50 border-red-200', dotColor: 'bg-red-500' };
    case 'completed':
      return { label: 'Completed', color: 'text-blue-800', bgColor: 'bg-blue-50 border-blue-200', dotColor: 'bg-blue-500' };
    case 'no_show':
      return { label: 'No Show', color: 'text-gray-800', bgColor: 'bg-gray-50 border-gray-200', dotColor: 'bg-gray-500' };
    default:
      return { label: status, color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200', dotColor: 'bg-gray-400' };
  }
}

/**
 * Get human-readable package status label and color
 */
export function getPackageStatusInfo(status: PackageStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'active':
      return { label: 'Active', color: 'text-blue-800', bgColor: 'bg-blue-50 border-blue-200' };
    case 'completed':
      return { label: 'Completed', color: 'text-green-800', bgColor: 'bg-green-50 border-green-200' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'text-red-800', bgColor: 'bg-red-50 border-red-200' };
    default:
      return { label: status, color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' };
  }
}

