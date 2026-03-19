'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { getCourses, getCategories, Course, Category, CourseFilters } from '@/lib/api/courses';
import { useAuth } from '@/contexts/AuthContext';
import { getMyEnrollments, enrollInCourse } from '@/lib/api/enrollments';

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Instructors (and admins) can only browse — no enrollment or payment
  const isStudent = !!(user && user.role !== 'instructor' && user.role !== 'admin');

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Enrolled course IDs for current user
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [enrollMessage, setEnrollMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('');
  const [selectedMedium, setSelectedMedium] = useState('');

  useEffect(() => {
    loadCourses();
    loadCategories();
    if (isStudent) loadMyEnrollments();
  }, [user, isStudent]);

  const loadMyEnrollments = async () => {
    try {
      const enrollments = await getMyEnrollments();
      setEnrolledIds(new Set(enrollments.map((e) => e.courseId)));
    } catch {
      // silently fail – enrollment status is non-critical for listing
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: unknown) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadCourses = async (filters?: CourseFilters) => {
    try {
      setLoading(true);
      setError('');
      const data = await getCourses({ ...filters, published: true });
      setCourses(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load courses';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const filters: CourseFilters = { published: true };
    if (searchQuery) filters.search = searchQuery;
    if (selectedCategory) filters.category = selectedCategory;
    if (selectedLevel) filters.level = selectedLevel;
    if (selectedMedium) filters.medium = selectedMedium;
    loadCourses(filters);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLevel('');
    setSelectedMedium('');
    loadCourses({ published: true });
  };

  // ── Multi-select helpers ──────────────────────────────────────────────────

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedIds(new Set());
    setEnrollMessage(null);
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const enrollable = courses.filter((c) => !enrolledIds.has(c.id)).map((c) => c.id);
    setSelectedIds(new Set(enrollable));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkEnroll = () => {
    if (!user) {
      router.push('/login?redirect=/courses');
      return;
    }
    if (selectedIds.size === 0) return;
    // Navigate to the bulk checkout page with the selected course IDs
    const url = `/checkout/bulk?courseIds=${Array.from(selectedIds).join(',')}`;
    router.push(url);
  };

  // Single quick-enroll: free courses enroll immediately; paid courses go to checkout
  const handleQuickEnroll = async (e: React.MouseEvent, course: Course) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?redirect=/courses');
      return;
    }
    const isFree = Number(course.price || 0) === 0;
    if (isFree) {
      try {
        await enrollInCourse(course.id);
        setEnrolledIds((prev) => new Set([...prev, course.id]));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Enrollment failed';
        setEnrollMessage({ type: 'error', text: msg });
      }
    } else {
      // Route through payment checkout
      const basePrice = course.price || 0;
      const discountPercent = course.discountPercentage || 0;
      const effectivePrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;
      const checkoutUrl = new URL(window.location.origin + '/checkout');
      checkoutUrl.searchParams.append('type', 'course_enrollment');
      checkoutUrl.searchParams.append('referenceId', course.id);
      checkoutUrl.searchParams.append('price', effectivePrice.toString());
      checkoutUrl.searchParams.append('title', course.title || '');
      if (course.instructorId) checkoutUrl.searchParams.append('recipientId', course.instructorId);
      router.push(checkoutUrl.pathname + checkoutUrl.search);
    }
  };

  const selectableCount = courses.filter((c) => !enrolledIds.has(c.id)).length;

  const formatPrice = (price: number | string | undefined) => {
    const numPrice = Number(price || 0);
    return numPrice === 0 ? 'Free' : `LKR ${numPrice.toLocaleString()}`;
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

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Browse Courses</h1>
          <p className="text-slate-500 font-medium mt-1">Explore our wide range of courses and start learning today</p>
        </div>
        {isStudent && (
          <button
            onClick={toggleSelectionMode}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
              selectionMode
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {selectionMode ? '✕ Cancel Selection' : '☑ Select Multiple Courses'}
          </button>
        )}
      </div>

      {/* Enrollment feedback */}
      {enrollMessage && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${
            enrollMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {enrollMessage.text}
          <button onClick={() => setEnrollMessage(null)} className="ml-3 text-xs underline opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Sticky selection toolbar */}
      {selectionMode && (
        <div className="sticky top-4 z-30 bg-white border border-blue-200 rounded-xl shadow-lg px-5 py-3 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-semibold text-slate-800">
              {selectedIds.size} course{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <button onClick={selectAll} disabled={selectedIds.size === selectableCount} className="text-xs text-blue-600 hover:underline disabled:opacity-40">
              Select all ({selectableCount})
            </button>
            {selectedIds.size > 0 && (
              <button onClick={clearSelection} className="text-xs text-slate-500 hover:underline">Clear</button>
            )}
          </div>
          <button
            onClick={handleBulkEnroll}
            disabled={selectedIds.size === 0}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {`Proceed to Payment (${selectedIds.size} Course${selectedIds.size !== 1 ? 's' : ''})`}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1.5">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1.5">
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium text-slate-700 mb-1.5">
              Level
            </label>
            <select
              id="level"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced' | '')}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label htmlFor="medium" className="block text-sm font-medium text-slate-700 mb-1.5">
              Medium
            </label>
            <select
              id="medium"
              value={selectedMedium}
              onChange={(e) => setSelectedMedium(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value="">All Mediums</option>
              <option value="english">English</option>
              <option value="sinhala">Sinhala</option>
              <option value="tamil">Tamil</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSearch}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            Search
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            Reset
          </button>
        </div>
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
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No courses found</h3>
          <p className="text-slate-500 mb-6 text-sm">Try adjusting your filters or search query</p>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-slate-500">
            Found {courses.length} course{courses.length !== 1 ? 's' : ''}
            {selectionMode && (
              <span className="ml-2 text-blue-600 font-medium">— Click cards to select</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => {
              const isEnrolled = enrolledIds.has(course.id);
              const isSelected = selectedIds.has(course.id);
              const isFree = Number(course.price || 0) === 0;

              const cardContent = (
                <div
                  className={`bg-white rounded-xl shadow-sm overflow-hidden border transition group relative ${
                    selectionMode
                      ? isEnrolled
                        ? 'border-slate-200 opacity-60 cursor-default'
                        : isSelected
                        ? 'border-blue-500 ring-2 ring-blue-400 cursor-pointer'
                        : 'border-slate-200 hover:border-blue-300 cursor-pointer'
                      : 'border-slate-200 hover:shadow-md'
                  }`}
                  onClick={selectionMode && !isEnrolled ? () => toggleCourseSelection(course.id) : undefined}
                >
                  {/* Selection checkbox */}
                  {selectionMode && !isEnrolled && (
                    <div className="absolute top-3 left-3 z-10">
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white/90 border-slate-400'
                      }`}>
                        {isSelected && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Already-enrolled badge */}
                  {isEnrolled && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-semibold rounded-full shadow">Enrolled</span>
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="aspect-video bg-linear-to-br from-slate-100 to-slate-200 relative">
                    {course.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      {course.medium && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full border bg-blue-50 text-blue-700 border-blue-200 capitalize">
                          {course.medium}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getLevelBadgeColor(course.level)}`}>
                        {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    {course.category && (
                      <div className="text-xs text-blue-600 font-medium mb-1.5">{course.category.name}</div>
                    )}
                    <h3 className="text-base font-semibold text-slate-900 mb-1.5 line-clamp-2 group-hover:text-blue-700 transition">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                      {course.shortDescription || course.description}
                    </p>

                    {course.instructor && (
                      <div className="flex items-center mb-4 text-sm text-slate-500">
                        <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-blue-700 mr-2">
                          {course.instructor.firstName?.[0]}
                        </div>
                        <span>{course.instructor.firstName} {course.instructor.lastName}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex flex-col">
                        {course.discountPercentage != null && Number(course.discountPercentage) > 0 ? (
                          <>
                            <div className="text-xs text-slate-400 line-through decoration-red-400/50">
                              {formatPrice(course.price)}
                            </div>
                            <div className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
                              {formatPrice(Math.round(Number(course.price) * (1 - Number(course.discountPercentage) / 100) * 100) / 100)}
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {course.discountPercentage}% OFF
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-lg font-bold text-slate-900">{formatPrice(course.price)}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center text-sm text-slate-400">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {course.enrollmentCount}
                        </span>
                        {!selectionMode && isStudent && !isEnrolled && (
                          <button
                            onClick={(e) => handleQuickEnroll(e, course)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
                          >
                            {isFree ? 'Enroll Free' : 'Buy Now'}
                          </button>
                        )}
                        {!selectionMode && isStudent && isEnrolled && (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg">Enrolled</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );

              if (selectionMode) {
                return <div key={course.id}>{cardContent}</div>;
              }
              return (
                <Link key={course.id} href={`/courses/${course.id}`} className="block">
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </AppLayout>
  );
}
