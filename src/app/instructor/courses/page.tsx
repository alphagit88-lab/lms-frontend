'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMyCourses, deleteCourse, togglePublishCourse, Course } from '@/lib/api/courses';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

function InstructorCoursesContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyCourses();
      setCourses(data);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to load courses');
      setError(error.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string, courseName: string) => {
    if (!confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCourse(courseId);
      alert('Course deleted successfully');
      loadCourses();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to delete course');
      alert(error.message || 'Failed to delete course');
    }
  };

  const handleTogglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      await togglePublishCourse(courseId, !currentStatus);
      alert(`Course ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      loadCourses();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to toggle publish status');
      alert(error.message || 'Failed to toggle publish status');
    }
  };

  const getStatusBadge = (course: Course) => {
    if (course.isPublished) {
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Published</span>;
    }
    return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">Draft</span>;
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your courses and track student engagement</p>
        </div>
        <Link
          href="/instructor/courses/create"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm self-start"
        >
          + Create Course
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-slate-500">Loading courses...</p>
          </div>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No courses yet</h3>
          <p className="text-slate-500 mb-6 text-sm">
            Create your first course and start sharing your knowledge with students
          </p>
          <Link
            href="/instructor/courses/create"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Create Your First Course
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex items-start gap-5">
                {/* Thumbnail */}
                <div className="flex-shrink-0 hidden sm:block">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-36 h-24 object-cover rounded-lg" />
                  ) : (
                    <div className="w-36 h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-semibold text-slate-900 truncate">{course.title}</h3>
                        {getStatusBadge(course)}
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {course.shortDescription || course.description}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-5 mt-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {course.enrollmentCount} students
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
                      </svg>
                      {course.lessons?.length || 0} lessons
                    </span>
                    <span className="font-medium text-slate-900">${Number(course.price || 0).toFixed(2)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-4">
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-sm text-slate-600 hover:text-slate-900 font-medium transition"
                    >
                      View
                    </Link>
                    <Link
                      href={`/instructor/courses/${course.id}/edit`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleTogglePublish(course.id, course.isPublished)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition"
                    >
                      {course.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDelete(course.id, course.title)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

export default function InstructorCoursesPage() {
  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <InstructorCoursesContent />
    </ProtectedRoute>
  );
}
