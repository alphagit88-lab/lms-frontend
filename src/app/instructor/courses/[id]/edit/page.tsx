'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getCourseById,
  updateCourse,
  deleteCourse,
  togglePublishCourse,
  getCategories,
  Course,
  Category,
  UpdateCourseData,
} from '@/lib/api/courses';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

function EditCourseContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<UpdateCourseData>({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    level: 'beginner',
    price: 0,
    thumbnail: '',
    previewVideoUrl: '',
  });

  useEffect(() => {
    loadCourse();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const data = await getCourseById(courseId);
      setCourse(data);
      setFormData({
        title: data.title || '',
        slug: data.slug || '',
        description: data.description || '',
        shortDescription: data.shortDescription || '',
        categoryId: data.category?.id || '',
        level: data.level || 'beginner',
        price: data.price || 0,
        thumbnail: data.thumbnail || '',
        previewVideoUrl: data.previewVideoUrl || '',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title?.trim()) {
      setError('Title is required');
      return;
    }
    if (formData.title.length > 200) {
      setError('Title must be less than 200 characters');
      return;
    }
    if (!formData.description?.trim()) {
      setError('Description is required');
      return;
    }
    if (formData.description.length > 5000) {
      setError('Description must be less than 5000 characters');
      return;
    }

    try {
      setSaving(true);
      await updateCourse(courseId, formData);
      alert('Course updated successfully!');
      loadCourse(); // Reload to get updated data
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!course) return;

    const action = course.isPublished ? 'unpublish' : 'publish';
    if (!confirm(`Are you sure you want to ${action} this course?`)) return;

    try {
      await togglePublishCourse(courseId, !course.isPublished);
      alert(`Course ${action}ed successfully!`);
      loadCourse();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : `Failed to ${action} course`);
    }
  };

  const handleDelete = async () => {
    if (!course) return;

    if (!confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) {
      return;
    }

    const confirmText = prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') {
      return;
    }

    try {
      await deleteCourse(courseId);
      alert('Course deleted successfully');
      router.push('/instructor/courses');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete course');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-700">{error}</p>
          <Link
            href="/instructor/courses"
            className="mt-4 inline-block text-black hover:underline"
          >
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is the instructor of this course
  const isOwner = user?.id === course?.instructor?.id || user?.role === 'admin';
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Access Denied</div>
          <p className="text-gray-700">You don&apos;t have permission to edit this course.</p>
          <Link
            href="/instructor/courses"
            className="mt-4 inline-block text-black hover:underline"
          >
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/instructor/courses"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
                <p className="mt-1 text-gray-600">
                  Last updated: {new Date(course?.updatedAt || '').toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Publish Status Badge */}
            <div>
              {course?.isPublished ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Published
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  ⏸ Draft
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-gray-900">{course?.enrollmentCount || 0}</div>
              <div className="text-sm text-gray-600">Students Enrolled</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{course?.lessons?.length || 0}</div>
              <div className="text-sm text-gray-600">Lessons</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">${course?.price?.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Price</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">{formData.title?.length || 0}/200 characters</p>
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
              Course Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              pattern="[a-z0-9-]+"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              URL-friendly version (lowercase letters, numbers, and hyphens only)
            </p>
          </div>

          {/* Short Description */}
          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <input
              type="text"
              id="shortDescription"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Displayed in course listings (optional, max 200 characters)
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Full Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={8}
              maxLength={5000}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">{formData.description?.length || 0}/5000 characters</p>
          </div>

          {/* Category and Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level <span className="text-red-500">*</span>
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Set to 0 for free courses</p>
          </div>

          {/* Thumbnail URL */}
          <div>
            <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail Image URL
            </label>
            <input
              type="url"
              id="thumbnail"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Preview Video URL */}
          <div>
            <label htmlFor="previewVideoUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Preview Video URL
            </label>
            <input
              type="url"
              id="previewVideoUrl"
              name="previewVideoUrl"
              value={formData.previewVideoUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/instructor/courses"
              className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Publish/Unpublish Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Publishing</h2>
          <p className="text-gray-600 mb-4">
            {course?.isPublished
              ? 'This course is currently published and visible to students.'
              : 'This course is currently a draft and not visible to students.'}
          </p>
          <button
            onClick={handleTogglePublish}
            className={`px-6 py-2 rounded-md transition ${
              course?.isPublished
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {course?.isPublished ? 'Unpublish Course' : 'Publish Course'}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6 border-2 border-red-200">
          <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
          <p className="text-gray-600 mb-4">
            Once you delete a course, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDelete}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Delete Course
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditCoursePage() {
  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <EditCourseContent />
    </ProtectedRoute>
  );
}
