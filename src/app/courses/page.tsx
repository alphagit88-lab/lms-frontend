'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    loadCourses(filters);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLevel('');
    loadCourses({ published: true });
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Browse Courses</h1>
          <p className="mt-2 text-gray-600">Explore our wide range of courses and start learning today</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                id="level"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced' | '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
            >
              Search
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : courses.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Course Grid */
          <>
            <div className="mb-4 text-sm text-gray-600">
              Found {courses.length} course{courses.length !== 1 ? 's' : ''}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <span className="text-4xl">📚</span>
                      </div>
                    )}
                    
                    {/* Level Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getLevelBadgeColor(course.level)}`}>
                        {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Category */}
                    {course.category && (
                      <div className="text-xs text-gray-500 mb-2">
                        {course.category.name}
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.shortDescription || course.description}
                    </p>

                    {/* Instructor */}
                    {course.instructor && (
                      <div className="flex items-center mb-4 text-sm text-gray-600">
                        <span className="mr-1">👤</span>
                        <span>
                          {course.instructor.firstName} {course.instructor.lastName}
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      {/* Price */}
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(course.price)}
                      </div>

                      {/* Enrollment Count */}
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-1">👥</span>
                        <span>{course.enrollmentCount} enrolled</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
