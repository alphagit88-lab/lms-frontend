'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createCourse, getCategories, Category, CreateCourseData } from '@/lib/api/courses';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

function CreateCourseContent() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreateCourseData>({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
    }));

    if (name === 'title' && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) { setError('Title is required'); return; }
    if (formData.title.length > 200) { setError('Title must be less than 200 characters'); return; }
    if (!formData.slug.trim()) { setError('Slug is required'); return; }
    if (!formData.description.trim()) { setError('Description is required'); return; }
    if (formData.description.length > 5000) { setError('Description must be less than 5000 characters'); return; }

    try {
      setLoading(true);
      const course = await createCourse(formData);
      alert('Course created successfully!');
      router.push(`/instructor/courses/${course.id}/edit`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm";

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/instructor/courses" className="text-slate-400 hover:text-slate-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New Course</h1>
          <p className="text-sm text-slate-500 mt-0.5">Fill in the details below to create your course</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 max-w-3xl">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
            Course Title <span className="text-red-500">*</span>
          </label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange}
            placeholder="e.g., Full Stack Web Development for Beginners" required maxLength={200} className={inputClasses} />
          <p className="mt-1 text-xs text-slate-400">{formData.title.length}/200 characters</p>
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1.5">
            Course Slug <span className="text-red-500">*</span>
          </label>
          <input type="text" id="slug" name="slug" value={formData.slug} onChange={handleChange}
            placeholder="e.g., fullstack-web-development" required pattern="[a-z0-9-]+" className={inputClasses} />
          <p className="mt-1 text-xs text-slate-400">URL-friendly version (lowercase letters, numbers, and hyphens only)</p>
        </div>

        <div>
          <label htmlFor="shortDescription" className="block text-sm font-medium text-slate-700 mb-1.5">
            Short Description
          </label>
          <input type="text" id="shortDescription" name="shortDescription" value={formData.shortDescription}
            onChange={handleChange} placeholder="A brief one-liner about your course" maxLength={200} className={inputClasses} />
          <p className="mt-1 text-xs text-slate-400">Displayed in course listings (optional, max 200 characters)</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
            Full Description <span className="text-red-500">*</span>
          </label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange}
            placeholder="Provide a detailed description of what students will learn..." required rows={8} maxLength={5000}
            className={inputClasses} />
          <p className="mt-1 text-xs text-slate-400">{formData.description.length}/5000 characters</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} className={inputClasses}>
              <option value="">Select a category</option>
              {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-slate-700 mb-1.5">
              Difficulty Level <span className="text-red-500">*</span>
            </label>
            <select id="level" name="level" value={formData.level} onChange={handleChange} required className={inputClasses}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1.5">
            Price (USD) <span className="text-red-500">*</span>
          </label>
          <input type="number" id="price" name="price" value={formData.price} onChange={handleChange}
            min="0" step="0.01" required className={inputClasses} />
          <p className="mt-1 text-xs text-slate-400">Set to 0 for free courses</p>
        </div>

        <div>
          <label htmlFor="thumbnail" className="block text-sm font-medium text-slate-700 mb-1.5">Thumbnail Image URL</label>
          <input type="url" id="thumbnail" name="thumbnail" value={formData.thumbnail} onChange={handleChange}
            placeholder="https://example.com/image.jpg" className={inputClasses} />
        </div>

        <div>
          <label htmlFor="previewVideoUrl" className="block text-sm font-medium text-slate-700 mb-1.5">Preview Video URL</label>
          <input type="url" id="previewVideoUrl" name="previewVideoUrl" value={formData.previewVideoUrl}
            onChange={handleChange} placeholder="https://youtube.com/watch?v=..." className={inputClasses} />
        </div>

        <div className="flex gap-3 pt-5 border-t border-slate-100">
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm">
            {loading ? 'Creating...' : 'Create Course'}
          </button>
          <Link href="/instructor/courses"
            className="px-6 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </AppLayout>
  );
}

export default function CreateCoursePage() {
  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <CreateCourseContent />
    </ProtectedRoute>
  );
}
