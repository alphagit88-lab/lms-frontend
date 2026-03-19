'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import {
  BookingPackage,
  PackageStatus,
  getMyPackages,
  getPackageById,
  getPackageStatusInfo,
  getBookingStatusInfo,
  Booking,
} from '@/lib/api/bookings';
import { formatDate, formatTimeRange, calculateDuration } from '@/lib/api/availability';

export default function PackagesPage() {
  useAuth();

  const [packages, setPackages] = useState<BookingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<PackageStatus | ''>('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedBookings, setExpandedBookings] = useState<Booking[]>([]);
  const [expandedLoading, setExpandedLoading] = useState(false);

  const loadPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyPackages(
        statusFilter ? { status: statusFilter as PackageStatus } : undefined
      );
      setPackages(data);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to load packages');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  async function toggleExpand(pkgId: string) {
    if (expandedId === pkgId) {
      setExpandedId(null);
      setExpandedBookings([]);
      return;
    }

    setExpandedId(pkgId);
    setExpandedLoading(true);
    try {
      const data = await getPackageById(pkgId);
      setExpandedBookings(data.bookings);
    } catch {
      setExpandedBookings([]);
    } finally {
      setExpandedLoading(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={['student', 'parent', 'admin']}>
      <AppLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Session Packages</h1>
            <p className="text-sm text-slate-500 mt-1">View and manage your multi-session bookings</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PackageStatus | '')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          >
            <option value="">All Packages</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <span>{error}</span>
            <button onClick={loadPackages} className="ml-auto text-sm font-medium underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-slate-500">Loading packages...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No packages found</h3>
            <p className="text-sm text-slate-500 mb-4">
              {statusFilter
                ? `No ${statusFilter} packages found. Try a different filter.`
                : 'Book multiple sessions at once to create a package!'}
            </p>
            <Link
              href="/teachers"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Find a Teacher
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg) => {
              const statusInfo = getPackageStatusInfo(pkg.status);
              const isExpanded = expandedId === pkg.id;
              const progress = pkg.totalSessions > 0
                ? Math.round((pkg.completedSessions / pkg.totalSessions) * 100)
                : 0;

              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div
                    className="px-5 py-4 cursor-pointer hover:bg-slate-50 transition"
                    onClick={() => toggleExpand(pkg.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {pkg.title || 'Session Package'}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {pkg.teacher ? `${pkg.teacher.firstName} ${pkg.teacher.lastName}` : 'Multi-Instructor'}
                          </span>
                          <span>
                            {pkg.completedSessions}/{pkg.totalSessions} sessions
                          </span>
                          <span className="font-medium text-emerald-700">
                            LKR {Number(pkg.finalPrice).toLocaleString()}
                          </span>
                          {pkg.discountPercentage > 0 && (
                            <span className="text-xs text-emerald-600">
                              ({pkg.discountPercentage}% discount)
                            </span>
                          )}
                        </div>

                        {pkg.status === 'active' && (
                          <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 max-w-xs">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {new Date(pkg.createdAt).toLocaleDateString()}
                        </span>
                        <svg
                          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200 px-5 py-4 bg-slate-50">
                      {expandedLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-sm text-slate-500">Loading sessions...</span>
                        </div>
                      ) : expandedBookings.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No sessions found</p>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                            Sessions ({expandedBookings.length})
                          </h4>
                          {expandedBookings.map((booking, index) => {
                            const bStatusInfo = getBookingStatusInfo(booking.status);
                            const duration = calculateDuration(booking.sessionStartTime, booking.sessionEndTime);
                            return (
                              <div
                                key={booking.id}
                                className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-slate-200"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                                    {index + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-slate-900">
                                      {formatDate(booking.sessionStartTime)}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {formatTimeRange(booking.sessionStartTime, booking.sessionEndTime)}
                                      {booking.teacher && !pkg.teacher && (
                                        <span className="text-blue-600 font-medium ml-1">
                                          • {booking.teacher.firstName} {booking.teacher.lastName}
                                        </span>
                                      )}
                                      <span className="text-slate-400 ml-1">({duration} min)</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {booking.amount != null && Number(booking.amount) > 0 && (
                                    <span className="text-sm text-slate-600">
                                      LKR {Number(booking.amount).toLocaleString()}
                                    </span>
                                  )}
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${bStatusInfo.bgColor} ${bStatusInfo.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${bStatusInfo.dotColor}`} />
                                    {bStatusInfo.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-sm">
                            <div className="text-slate-500">
                              {pkg.completedSessions} completed
                              {pkg.cancelledSessions > 0 && ` · ${pkg.cancelledSessions} cancelled`}
                            </div>
                            
                            {expandedBookings.some(b => b.status === 'pending_payment') && (
                                <Link
                                    href={`/payments/checkout?type=booking_package&referenceId=${pkg.id}&amount=${pkg.finalPrice}&recipientId=${pkg.teacherId}`}
                                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition flex items-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    Pay for Package (LKR {Number(pkg.finalPrice).toLocaleString()})
                                </Link>
                            )}

                            {pkg.discountPercentage > 0 && (
                              <div className="text-emerald-700 font-medium">
                                {pkg.discountPercentage}% package discount applied
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
