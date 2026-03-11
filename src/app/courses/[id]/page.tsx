'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AppLayout from '@/components/layout/AppLayout';
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
  }, [courseId]); // loadCourse is defined outside effect, dependency not needed

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

    setEnrolling(true);
    // Push to the new checkout system
    const checkoutUrl = new URL(window.location.origin + '/checkout');
    checkoutUrl.searchParams.append('type', 'course_enrollment');
    checkoutUrl.searchParams.append('referenceId', courseId);
    checkoutUrl.searchParams.append('price', course?.price?.toString() || "0");
    checkoutUrl.searchParams.append('title', course?.title || "");
    if (course?.instructorId) checkoutUrl.searchParams.append('recipientId', course.instructorId);

    router.push(checkoutUrl.pathname + checkoutUrl.search);
  };

  const formatPrice = (price: number | string | undefined) => {
    const numPrice = Number(price || 0);
    return numPrice === 0 ? 'Free' : `$${numPrice.toFixed(2)}`;
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'intermediate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'advanced':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-slate-500">Loading course...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !course) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2a10 10 0 110 20 10 10 0 010-20z" />
          </svg>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Course Not Found</h2>
          <p className="text-slate-500 mb-6 text-sm">{error || 'The course you are looking for does not exist.'}</p>
          <Link href="/courses" className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            Browse Courses
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isInstructor = user && (course.instructorId === user.id || user.role === 'admin');

  return (
    <AppLayout>
      {/* Breadcrumb */}
      <div className="text-sm mb-6 flex items-center gap-2 text-slate-500">
        <Link href="/courses" className="hover:text-blue-600 transition">Courses</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-900 font-medium truncate">{course.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Course Info */}
        <div className="lg:col-span-2">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-8 mb-8">
            {course.category && (
              <span className="text-xs font-medium text-blue-300 bg-blue-900/40 px-2.5 py-1 rounded-full">
                {course.category.name}
              </span>
            )}
            <h1 className="text-3xl font-bold mt-3 mb-4">{course.title}</h1>
            <p className="text-slate-300 text-base mb-6 leading-relaxed">
              {course.shortDescription || course.description.substring(0, 150) + '...'}
            </p>

            <div className="flex flex-wrap gap-3 text-sm">
              <span className={`px-3 py-1 rounded-full border text-xs font-medium ${getLevelBadgeColor(course.level)}`}>
                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
              </span>
              {course.medium && (
                <span className="px-3 py-1 rounded-full border text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 capitalize">
                  {course.medium}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-slate-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {course.enrollmentCount} students
              </span>
              {course.durationHours && (
                <span className="flex items-center gap-1.5 text-slate-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {course.durationHours} hours
                </span>
              )}
              {course.lessons && course.lessons.length > 0 && (
                <span className="flex items-center gap-1.5 text-slate-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
                  </svg>
                  {course.lessons.length} lessons
                </span>
              )}
            </div>

            {course.instructor && (
              <div className="mt-6 flex items-center">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-sm font-bold">
                  {course.instructor.firstName?.[0]}{course.instructor.lastName?.[0]}
                </div>
                <div className="ml-3">
                  <div className="text-xs text-slate-400">Instructor</div>
                  <div className="font-medium text-sm">
                    {course.instructor.firstName} {course.instructor.lastName}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">About this course</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                {course.description}
              </div>
            </div>
          </section>

          {/* Curriculum */}
          {course.lessons && course.lessons.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Course Curriculum</h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {course.lessons
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center flex-1">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-semibold text-slate-700 mr-3 flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 text-sm">{lesson.title}</div>
                          {lesson.durationMinutes > 0 && (
                            <div className="text-xs text-slate-500">{lesson.durationMinutes} min</div>
                          )}
                        </div>
                      </div>
                      {lesson.isPreview && (
                        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium ml-2">
                          Preview
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Exams */}
          {course.exams && course.exams.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Exams & Assessments</h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {course.exams
                  .filter(exam => exam.isPublished || isInstructor)
                  .map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center flex-1">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 text-sm">{exam.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                            {(exam.durationMinutes ?? 0) > 0 ? `${exam.durationMinutes} min` : 'Untimed'} • {exam.totalMarks} Marks
                            <span className="inline-block w-1 h-1 bg-slate-300 rounded-full" />
                            {exam.examType.toUpperCase().replace('_', ' ')}
                          </div>
                        </div>
                      </div>

                      {course.isEnrolled && exam.isPublished ? (
                        <Link
                          href={`/exams/${exam.id}/take`}
                          className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-700 hover:-translate-y-0.5 transition-all shadow-blue-600/20"
                        >
                          Take Exam
                        </Link>
                      ) : isInstructor ? (
                        <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1 rounded-full font-medium ml-2">
                          {exam.isPublished ? 'Published' : 'Draft'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 font-medium">Enrolled Students Only</span>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: Enrollment Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-24">
            {course.thumbnail ? (
              <Image src={course.thumbnail} alt={course.title} width={400} height={225} className="w-full aspect-video object-cover rounded-lg mb-5" />
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-5 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}

            <div className="text-3xl font-bold text-slate-900 mb-5">{formatPrice(course.price)}</div>

            {isInstructor ? (
              <Link
                href={`/instructor/courses/${course.id}/edit`}
                className="block w-full px-5 py-3 bg-blue-600 text-white text-center rounded-lg font-medium text-sm hover:bg-blue-700 transition mb-4"
              >
                Edit Course
              </Link>
            ) : course.isEnrolled ? (
              <button disabled className="w-full px-5 py-3 bg-emerald-600 text-white rounded-lg font-medium text-sm cursor-not-allowed mb-4 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Enrolled
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full px-5 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed mb-4"
              >
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </button>
            )}

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center text-sm text-slate-600">
                <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Lifetime access
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Access on mobile and desktop
              </div>
              {course.lessons && course.lessons.length > 0 && (
                <div className="flex items-center text-sm text-slate-600">
                  <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {course.lessons.length} lessons
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
