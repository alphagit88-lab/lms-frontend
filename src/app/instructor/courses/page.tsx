'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMyCourses, deleteCourse, togglePublishCourse, Course } from '@/lib/api/courses';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

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
      loadCourses(); // Reload list
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to delete course');
      alert(error.message || 'Failed to delete course');
    }
  };

  const handleTogglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      await togglePublishCourse(courseId, !currentStatus);
      alert(`Course ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      loadCourses(); // Reload list
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to toggle publish status');
      alert(error.message || 'Failed to toggle publish status');
    }
  };

  const getStatusBadge = (course: Course) => {
    if (course.isPublished) {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">Published</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">Draft</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
              <p className="mt-2 text-gray-600">Manage your courses and track student engagement</p>
            </div>
            <Link
              href="/instructor/courses/create"
              className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
            >
              + Create Course
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Empty State */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first course and start sharing your knowledge with students
            </p>
            <Link
              href="/instructor/courses/create"
              className="inline-block px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
            >
              Create Your First Course
            </Link>
          </div>
        ) : (
          /* Courses List */
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start gap-6">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-40 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-40 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-3xl">📚</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold text-gray-900 truncate">
                            {course.title}
                          </h3>
                          {getStatusBadge(course)}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {course.shortDescription || course.description}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="mr-1">👥</span>
                        <span>{course.enrollmentCount} students</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-1">📚</span>
                        <span>{course.lessons?.length || 0} lessons</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-1">💰</span>
                        <span>${course.price.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-4">
                      <Link
                        href={`/courses/${course.id}`}
                        className="text-sm text-gray-700 hover:text-gray-900 underline"
                      >
                        View
                      </Link>
                      <Link
                        href={`/instructor/courses/${course.id}/edit`}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(course.id, course.isPublished)}
                        className="text-sm text-green-600 hover:text-green-800 underline"
                      >
                        {course.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(course.id, course.title)}
                        className="text-sm text-red-600 hover:text-red-800 underline"
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
      </div>
    </div>
  );
}

export default function InstructorCoursesPage() {
  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <InstructorCoursesContent />
    </ProtectedRoute>
  );
}
