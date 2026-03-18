'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { getStudentProgress, StudentProgress } from '@/lib/api/parent';

export default function StudentProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;

  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'parent') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'parent' && studentId) {
      loadProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, studentId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await getStudentProgress(studentId);
      setProgress(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'active':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'dropped':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">Loading progress...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="mb-4">
          <Link href="/parent" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Back */}
      <div className="mb-4">
        <Link href="/parent" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Student Learning Progress</h1>
        <p className="text-sm text-slate-500 mt-1">Detailed view of course enrollments and progress</p>
      </div>

      {/* Progress Summary */}
      {progress && progress.enrollments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Total Enrollments</h3>
            <p className="text-3xl font-bold text-slate-900">{progress.enrollments.length}</p>
          </div>
          <div className="p-5 bg-white border border-emerald-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Completed Courses</h3>
            <p className="text-3xl font-bold text-emerald-600">
              {progress.enrollments.filter((e) => e.status === 'completed').length}
            </p>
          </div>
          <div className="p-5 bg-white border border-blue-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Average Progress</h3>
            <p className="text-3xl font-bold text-blue-600">
              {Math.round(
                progress.enrollments.reduce((acc, e) => acc + e.progressPercentage, 0) /
                  progress.enrollments.length
              )}
              %
            </p>
          </div>
        </div>
      )}

      {/* Course Enrollments */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-slate-900">Course Enrollments</h2>

        {!progress || progress.enrollments.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-slate-500">No course enrollments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {progress.enrollments.map((enrollment) => (
              <div
                key={enrollment.courseId}
                className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {enrollment.courseTitle}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Enrolled on{' '}
                      {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(enrollment.status)}`}>
                    {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">Progress</span>
                    <span className="text-sm font-semibold text-slate-900">{enrollment.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${enrollment.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {enrollment.lastAccessedAt && (
                    <div>
                      <span className="text-slate-500">Last Accessed:</span>
                      <p className="font-medium text-slate-900">
                        {new Date(enrollment.lastAccessedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {enrollment.completedAt && (
                    <div>
                      <span className="text-slate-500">Completed:</span>
                      <p className="font-medium text-emerald-600">
                        {new Date(enrollment.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* View Course Button */}
                <div className="mt-4">
                  <Link
                    href={`/courses/${enrollment.courseId}`}
                    className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    View Course Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
