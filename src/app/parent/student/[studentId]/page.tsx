'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
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
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'active':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'dropped':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/20';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link
              href="/parent"
              className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/parent"
            className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white inline-flex items-center"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Student Learning Progress
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Detailed view of course enrollments and progress
          </p>
        </div>

        {/* Progress Summary */}
        {progress && progress.enrollments.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Total Enrollments
              </h3>
              <p className="text-3xl font-bold text-black dark:text-white">
                {progress.enrollments.length}
              </p>
            </div>
            <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Completed Courses
              </h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {progress.enrollments.filter((e) => e.status === 'completed').length}
              </p>
            </div>
            <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Average Progress
              </h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
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
          <h2 className="text-2xl font-semibold mb-6 text-black dark:text-white">
            Course Enrollments
          </h2>

          {!progress || progress.enrollments.length === 0 ? (
            <div className="text-center py-12 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <p className="text-zinc-600 dark:text-zinc-400">
                No course enrollments yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {progress.enrollments.map((enrollment) => (
                <div
                  key={enrollment.courseId}
                  className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                        {enrollment.courseTitle}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Enrolled on{' '}
                        {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        enrollment.status
                      )}`}
                    >
                      {enrollment.status.charAt(0).toUpperCase() +
                        enrollment.status.slice(1)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Progress
                      </span>
                      <span className="text-sm font-semibold text-black dark:text-white">
                        {enrollment.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-black dark:bg-white h-2 rounded-full transition-all"
                        style={{ width: `${enrollment.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {enrollment.lastAccessedAt && (
                      <div>
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Last Accessed:
                        </span>
                        <p className="font-medium text-black dark:text-white">
                          {new Date(enrollment.lastAccessedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {enrollment.completedAt && (
                      <div>
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Completed:
                        </span>
                        <p className="font-medium text-green-600 dark:text-green-400">
                          {new Date(enrollment.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* View Course Button */}
                  <div className="mt-4">
                    <Link
                      href={`/courses/${enrollment.courseId}`}
                      className="inline-block px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
                    >
                      View Course Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
