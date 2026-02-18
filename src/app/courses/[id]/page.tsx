'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCourseById, Course } from '@/lib/api/courses';
import { useAuth } from '@/contexts/AuthContext';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getCourseById(courseId);
      setCourse(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load course';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      router.push('/login?redirect=/courses/' + courseId);
      return;
    }

    try {
      setEnrolling(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enroll');
      }

      // Reload course to update enrollment status
      await loadCourse();
      alert('Successfully enrolled in the course!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enroll in course';
      alert(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The course you are looking for does not exist.'}</p>
          <Link
            href="/courses"
            className="inline-block px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  const isInstructor = user && (course.instructorId === user.id || user.role === 'admin');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Thumbnail */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Course Info */}
            <div className="lg:col-span-2">
              {/* Breadcrumb */}
              <div className="text-sm mb-4">
                <Link href="/courses" className="text-gray-400 hover:text-white">
                  Courses
                </Link>
                <span className="mx-2 text-gray-500">/</span>
                <span>{course.title}</span>
              </div>

              {/* Category */}
              {course.category && (
                <div className="text-sm text-gray-400 mb-2">{course.category.name}</div>
              )}

              {/* Title */}
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>

              {/* Short Description */}
              <p className="text-xl text-gray-300 mb-6">
                {course.shortDescription || course.description.substring(0, 150) + '...'}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                {/* Level */}
                <span className={`px-3 py-1 rounded ${getLevelBadgeColor(course.level)}`}>
                  {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                </span>

                {/* Enrollment Count */}
                <div className="flex items-center">
                  <span className="mr-1">👥</span>
                  <span>{course.enrollmentCount} students enrolled</span>
                </div>

                {/* Duration */}
                {course.durationHours && (
                  <div className="flex items-center">
                    <span className="mr-1">⏱️</span>
                    <span>{course.durationHours} hours</span>
                  </div>
                )}

                {/* Lessons */}
                {course.lessons && course.lessons.length > 0 && (
                  <div className="flex items-center">
                    <span className="mr-1">📚</span>
                    <span>{course.lessons.length} lessons</span>
                  </div>
                )}
              </div>

              {/* Instructor */}
              {course.instructor && (
                <div className="mt-6 flex items-center">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-400">Instructor</div>
                    <div className="font-semibold">
                      {course.instructor.firstName} {course.instructor.lastName}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Enrollment Card */}
            <div className="lg:col-span-1">
              <div className="bg-white text-gray-900 rounded-lg shadow-lg p-6 sticky top-4">
                {/* Thumbnail */}
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full aspect-video object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-6xl">📚</span>
                  </div>
                )}

                {/* Price */}
                <div className="text-3xl font-bold mb-4">{formatPrice(course.price)}</div>

                {/* Enrollment Button */}
                {isInstructor ? (
                  <Link
                    href={`/instructor/courses/${course.id}/edit`}
                    className="block w-full px-6 py-3 bg-gray-900 text-white text-center rounded-md hover:bg-gray-800 transition mb-3"
                  >
                    Edit Course
                  </Link>
                ) : course.isEnrolled ? (
                  <button
                    disabled
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-md cursor-not-allowed mb-3"
                  >
                    ✓ Enrolled
                  </button>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition disabled:bg-gray-400 mb-3"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}

                {/* Features */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center text-sm">
                    <span className="mr-2">✓</span>
                    <span>Lifetime access</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="mr-2">✓</span>
                    <span>Access on mobile and desktop</span>
                  </div>
                  {course.lessons && course.lessons.length > 0 && (
                    <div className="flex items-center text-sm">
                      <span className="mr-2">✓</span>
                      <span>{course.lessons.length} lessons</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Course Details */}
          <div className="lg:col-span-2">
            {/* Description */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this course</h2>
              <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap">
                {course.description}
              </div>
            </section>

            {/* Curriculum */}
            {course.lessons && course.lessons.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Curriculum</h2>
                <div className="bg-white rounded-lg border border-gray-200">
                  {course.lessons
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="flex items-center flex-1">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-700 mr-3">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{lesson.title}</div>
                            {lesson.durationMinutes > 0 && (
                              <div className="text-sm text-gray-500">{lesson.durationMinutes} min</div>
                            )}
                          </div>
                        </div>
                        {lesson.isPreview && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Preview
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>

          {/* Right: Sidebar (empty for now, can add related courses later) */}
          <div className="lg:col-span-1">
            {/* Future: Related courses, reviews, etc. */}
          </div>
        </div>
      </div>
    </div>
  );
}
