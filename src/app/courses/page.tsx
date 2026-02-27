'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { getCourses, getCategories, Course, Category, CourseFilters } from '@/lib/api/courses';

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('');
  const [selectedMedium, setSelectedMedium] = useState('');

  useEffect(() => {
    loadCourses();
    loadCategories();
  }, []);

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

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Browse Courses</h1>
        <p className="text-slate-500 font-medium mt-1">Explore our wide range of courses and start learning today</p>
      </div>

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-slate-200 group"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative">
                  {course.thumbnail ? (
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
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-blue-700 mr-2">
                        {course.instructor.firstName?.[0]}
                      </div>
                      <span>{course.instructor.firstName} {course.instructor.lastName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="text-lg font-bold text-slate-900">{formatPrice(course.price)}</div>
                    <div className="flex items-center text-sm text-slate-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {course.enrollmentCount}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}
