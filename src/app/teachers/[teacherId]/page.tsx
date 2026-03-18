'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  TeacherProfile,
  getTeacherProfile,
  getSimilarTeachers,
  getTeacherDisplayName,
  parseSubjects,
  parseLanguages,
  formatRating,
} from '@/lib/api/teachers';
import { AvailabilitySlot, formatTimeRange, formatDate, calculateDuration } from '@/lib/api/availability';
import { Booking, CreatePackageBookingResponse } from '@/lib/api/bookings';
import AvailabilityCalendar from '@/components/booking/AvailabilityCalendar';
import BookingConfirmDialog from '@/components/booking/BookingConfirmDialog';
import BookingSuccess from '@/components/booking/BookingSuccess';
import PackageBookingModal from '@/components/booking/PackageBookingModal';

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const teacherId = params.teacherId as string;

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking mode: 'single' or 'package'
  const [bookingMode, setBookingMode] = useState<'single' | 'package'>('single');

  // Single booking flow state
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Package booking flow state
  const [selectedSlots, setSelectedSlots] = useState<AvailabilitySlot[]>([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageSuccess, setPackageSuccess] = useState<CreatePackageBookingResponse | null>(null);

  // Key to force calendar re-fetch after a booking
  const [calendarKey, setCalendarKey] = useState(0);

  // Similar teachers
  const [similarTeachers, setSimilarTeachers] = useState<TeacherProfile[]>([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError('');
        const data = await getTeacherProfile(teacherId);
        setProfile(data);
        getSimilarTeachers(teacherId, 4).then(setSimilarTeachers).catch(() => {});
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Failed to load teacher profile');
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    if (teacherId) loadProfile();
  }, [teacherId]);

  // Handle slot click based on booking mode
  const handleSlotSelect = useCallback((slot: AvailabilitySlot) => {
    if (bookingMode === 'package') {
      setSelectedSlots((prev) => {
        const exists = prev.find((s) => s.id === slot.id);
        if (exists) {
          // Deselect
          return prev.filter((s) => s.id !== slot.id);
        }
        // Add to selection (max 20)
        if (prev.length >= 20) return prev;
        return [...prev, slot];
      });
    } else {
      setSelectedSlot(slot);
    }
  }, [bookingMode]);

  // Single booking handlers
  const handleBookSlot = useCallback(() => {
    if (!user) {
      router.push(`/login?redirect=/teachers/${teacherId}`);
      return;
    }
    if (user.role !== 'student') return;
    setShowConfirmDialog(true);
  }, [user, router, teacherId]);

  const handleCloseConfirm = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  const handleBookingSuccess = useCallback((booking: Booking) => {
    setCreatedBooking(booking);
    setShowConfirmDialog(false);
    setSelectedSlot(null);
    setCalendarKey((prev) => prev + 1);

    // Paid slot → go straight to checkout; student must pay before teacher sees it
    if (booking.status === 'pending_payment' && booking.amount && Number(booking.amount) > 0) {
      router.push(
        `/payments/checkout?type=booking_session&referenceId=${booking.id}&amount=${booking.amount}&recipientId=${booking.teacherId}`
      );
      return;
    }

    setShowSuccess(true);
  }, [router]);

  const handleCloseSuccess = useCallback(() => {
    setShowSuccess(false);
    setCreatedBooking(null);
  }, []);

  // Package booking handlers
  const handleOpenPackageModal = useCallback(() => {
    if (!user) {
      router.push(`/login?redirect=/teachers/${teacherId}`);
      return;
    }
    if (user.role !== 'student') return;
    setShowPackageModal(true);
  }, [user, router, teacherId]);

  const handleRemoveSlotFromPackage = useCallback((slotId: string) => {
    setSelectedSlots((prev) => prev.filter((s) => s.id !== slotId));
  }, []);

  const handlePackageSuccess = useCallback((response: CreatePackageBookingResponse) => {
    setPackageSuccess(response);
    setShowPackageModal(false);
    setSelectedSlots([]);
    setCalendarKey((prev) => prev + 1);

    // Paid package → go straight to checkout; student must pay before teacher sees it
    if (response.package.finalPrice && Number(response.package.finalPrice) > 0) {
      router.push(
        `/payments/checkout?type=booking_package&referenceId=${response.package.id}&amount=${response.package.finalPrice}&recipientId=${response.package.teacherId}`
      );
    }
  }, [router]);

  const handleClosePackageSuccess = useCallback(() => {
    setPackageSuccess(null);
  }, []);

  // Mode toggle
  const handleModeToggle = useCallback((mode: 'single' | 'package') => {
    setBookingMode(mode);
    setSelectedSlot(null);
    setSelectedSlots([]);
  }, []);

  const handleViewBookings = useCallback(() => {
    router.push('/bookings');
  }, [router]);

  const handleCloseSlotPanel = useCallback(() => {
    setSelectedSlot(null);
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-sm text-slate-500">Loading teacher profile...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error || !profile) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
            <svg className="w-12 h-12 text-red-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              {error || 'Teacher not found'}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              This teacher profile may not exist or is unavailable.
            </p>
            <Link
              href="/teachers"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Browse All Teachers
            </Link>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const name = getTeacherDisplayName(profile);
  const subjects = parseSubjects(profile.subjects);
  const languages = parseLanguages(profile.teachingLanguages);
  const ratingDisplay = formatRating(profile.rating ? Number(profile.rating) : undefined);
  const initials = `${profile.teacher.firstName[0]}${profile.teacher.lastName[0]}`.toUpperCase();

  const isStudent = user?.role === 'student';
  const isLoggedIn = !!user;

  return (
    <ProtectedRoute>
      <AppLayout>
        {/* Teacher Profile Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shrink-0">
              {profile.teacher.profilePicture ? (
                <Image
                  src={profile.teacher.profilePicture}
                  alt={name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{name}</h1>
                {profile.verified && (
                  <svg className="w-5 h-5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {profile.specialization && (
                <p className="text-slate-600 mb-2">{profile.specialization}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-slate-700">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-medium">{ratingDisplay}</span>
                  {profile.ratingCount > 0 && (
                    <span className="text-slate-400">({profile.ratingCount} reviews)</span>
                  )}
                </div>

                {profile.yearsExperience != null && profile.yearsExperience > 0 && (
                  <span className="text-slate-500">
                    {profile.yearsExperience} year{profile.yearsExperience !== 1 ? 's' : ''} experience
                  </span>
                )}

                {profile.totalSessions > 0 && (
                  <span className="text-slate-500">
                    {profile.totalSessions} sessions completed
                  </span>
                )}

                {profile.totalStudents > 0 && (
                  <span className="text-slate-500">
                    {profile.totalStudents} student{profile.totalStudents !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {profile.hourlyRate != null && Number(profile.hourlyRate) > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center shrink-0">
                <div className="text-xs text-emerald-600 font-medium">Hourly Rate</div>
                <div className="text-xl font-bold text-emerald-800">
                  LKR {Number(profile.hourlyRate).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-6">
            {profile.teacher.bio && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">About</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{profile.teacher.bio}</p>
              </div>
            )}

            {subjects.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subj) => (
                    <span key={subj} className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-800 rounded-lg text-sm font-medium">
                      {subj}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">Teaching Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <span key={lang} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-800 rounded-lg text-sm font-medium">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.qualifications && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">Qualifications</h3>
                <p className="text-sm text-slate-600 whitespace-pre-line">{profile.qualifications}</p>
              </div>
            )}
          </div>

          {/* Right column: Calendar */}
          <div className="lg:col-span-2">
            {/* Booking Mode Toggle + Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Available Slots</h2>
              {isStudent && (
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleModeToggle('single')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                      bookingMode === 'single'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Single Session
                  </button>
                  <button
                    onClick={() => handleModeToggle('package')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                      bookingMode === 'package'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Package Booking
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Package mode instruction */}
            {bookingMode === 'package' && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">Select multiple slots to book as a package</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Click on available slots to select/deselect. 3+ sessions = 5% off, 5+ sessions = 10% off.
                  </p>
                </div>
              </div>
            )}

            <AvailabilityCalendar
              key={calendarKey}
              teacherId={teacherId}
              onSlotSelect={handleSlotSelect}
              selectedSlotIds={bookingMode === 'package' ? selectedSlots.map((s) => s.id) : undefined}
              multiSelectMode={bookingMode === 'package'}
            />

            {/* ── Single mode: Selected Slot Panel ── */}
            {bookingMode === 'single' && selectedSlot && (
              <div className="mt-4 bg-white rounded-lg border-2 border-green-300 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Selected Time Slot
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(selectedSlot.startTime)}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
                        <span className="text-gray-400">({calculateDuration(selectedSlot.startTime, selectedSlot.endTime)} min)</span>
                      </div>
                      {selectedSlot.price != null && Number(selectedSlot.price) > 0 && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium text-green-700">
                            LKR {Number(selectedSlot.price).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedSlot.maxBookings > 1 && (
                        <div className="text-xs text-gray-400">
                          {selectedSlot.maxBookings - selectedSlot.currentBookings} of {selectedSlot.maxBookings} spots available
                        </div>
                      )}
                      {selectedSlot.notes && (
                        <div className="text-xs text-gray-500 mt-1 italic">{selectedSlot.notes}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    {!isLoggedIn ? (
                      <Link
                        href={`/login?redirect=/teachers/${teacherId}`}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center gap-2 whitespace-nowrap"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Login to Book
                      </Link>
                    ) : isStudent ? (
                      <button
                        onClick={handleBookSlot}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center gap-2 whitespace-nowrap"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Book This Slot
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Only students can book slots</span>
                    )}
                    <button
                      onClick={handleCloseSlotPanel}
                      className="px-5 py-2 text-sm text-gray-600 hover:text-gray-800 transition text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Package mode: Selection Summary Bar ── */}
            {bookingMode === 'package' && selectedSlots.length > 0 && (
              <div className="mt-4 bg-white rounded-lg border-2 border-blue-300 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedSlots.length} session{selectedSlots.length !== 1 ? 's' : ''} selected
                    </h3>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {(() => {
                        const total = selectedSlots.reduce((sum, s) => sum + (s.price ? Number(s.price) : 0), 0);
                        const discount = selectedSlots.length >= 5 ? 10 : selectedSlots.length >= 3 ? 5 : 0;
                        const final_ = Math.round(total * (1 - discount / 100) * 100) / 100;
                        return (
                          <>
                            Total: <span className={discount > 0 ? 'line-through text-gray-400' : 'font-medium text-green-700'}>LKR {total.toLocaleString()}</span>
                            {discount > 0 && (
                              <>
                                {' → '}
                                <span className="font-medium text-green-700">LKR {final_.toLocaleString()}</span>
                                <span className="ml-1 text-xs text-green-600">({discount}% off)</span>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSlots([])}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleOpenPackageModal}
                      disabled={selectedSlots.length < 2}
                      className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Book Package
                    </button>
                  </div>
                </div>

                {selectedSlots.length < 2 && (
                  <p className="text-xs text-amber-600 mt-2">
                    Select at least 2 sessions to create a package booking.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Similar Teachers ── */}
        {similarTeachers.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Teachers with Similar Subjects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarTeachers.map((t) => {
                const tName = getTeacherDisplayName(t);
                const tSubjects = parseSubjects(t.subjects).slice(0, 3);
                const tRating = formatRating(t.rating ? Number(t.rating) : undefined);
                const tInitials = `${t.teacher.firstName[0]}${t.teacher.lastName[0]}`.toUpperCase();
                return (
                  <Link
                    key={t.id}
                    href={`/teachers/${t.teacherId}`}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-blue-300 transition flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {t.teacher.profilePicture ? (
                          <Image
                            src={t.teacher.profilePicture}
                            alt={tName}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          tInitials
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{tName}</p>
                          {t.verified && (
                            <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {tRating}
                        </div>
                      </div>
                    </div>
                    {tSubjects.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tSubjects.map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {t.hourlyRate != null && Number(t.hourlyRate) > 0 && (
                      <p className="text-xs text-emerald-700 font-medium">
                        LKR {Number(t.hourlyRate).toLocaleString()}/hr
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      {/* ── Single Booking Modals ── */}
      {selectedSlot && showConfirmDialog && (
        <BookingConfirmDialog
          isOpen={showConfirmDialog}
          slot={selectedSlot}
          teacherName={name}
          onClose={handleCloseConfirm}
          onSuccess={handleBookingSuccess}
        />
      )}

      {createdBooking && showSuccess && (
        <BookingSuccess
          isOpen={showSuccess}
          booking={createdBooking}
          teacherName={name}
          onClose={handleCloseSuccess}
          onViewBookings={handleViewBookings}
        />
      )}

      {/* ── Package Booking Modal ── */}
      {showPackageModal && (
        <PackageBookingModal
          isOpen={showPackageModal}
          slots={selectedSlots}
          teacherName={name}
          onClose={() => setShowPackageModal(false)}
          onSuccess={handlePackageSuccess}
          onRemoveSlot={handleRemoveSlotFromPackage}
        />
      )}

      {/* ── Package Success Modal ── */}
      {packageSuccess && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClosePackageSuccess} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl transform transition-all">
              <div className="px-6 py-8 text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-1">Package Booked!</h3>
                <p className="text-sm text-slate-500 mb-6">
                  {packageSuccess.bookings.length} sessions booked successfully
                  {packageSuccess.autoConfirmed && ' — Auto-confirmed!'}
                </p>

                <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3 mb-6">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Package ID</span>
                    <span className="font-mono">{packageSuccess.package.id.slice(0, 8)}...</span>
                  </div>
                  <div className="border-t border-slate-200" />
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-slate-600">{packageSuccess.package.title || 'Session Package'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="font-medium text-slate-900">{packageSuccess.bookings.length} sessions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-emerald-700">
                      LKR {Number(packageSuccess.package.finalPrice).toLocaleString()}
                    </span>
                    {packageSuccess.discount.saved > 0 && (
                      <span className="text-xs text-emerald-600">
                        (saved LKR {packageSuccess.discount.saved.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="button" onClick={handleViewBookings} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                    View My Bookings
                  </button>
                  <button type="button" onClick={() => router.push('/bookings/packages')} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                    View Packages
                  </button>
                  <button type="button" onClick={handleClosePackageSuccess} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                    Continue Browsing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
    </ProtectedRoute>
  );
}
