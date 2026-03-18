'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
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
  uploadCourseMedia,
  deleteCourseMedia,
} from '@/lib/api/courses';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import ManageLessonsInline from '@/components/instructor/ManageLessonsInline';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [thumbnailSource, setThumbnailSource] = useState<'url' | 'upload'>('url');
  const [videoSource, setVideoSource] = useState<'url' | 'upload'>('url');

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
    medium: 'english',
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

      const normalizeUrl = (url?: string) => {
        if (!url) return '';
        if (url.startsWith('/uploads/')) return API_URL + url;
        return url;
      };

      setFormData({
        title: data.title || '',
        slug: data.slug || '',
        description: data.description || '',
        shortDescription: data.shortDescription || '',
        categoryId: data.category?.id || '',
        level: data.level || 'beginner',
        price: data.price || 0,
        thumbnail: normalizeUrl(data.thumbnail),
        previewVideoUrl: normalizeUrl(data.previewVideoUrl),
        medium: data.medium || 'english',
      });
      if (data.thumbnail && data.thumbnail.includes('/uploads/')) {
        setThumbnailSource('upload');
      }
      if (data.previewVideoUrl && data.previewVideoUrl.includes('/uploads/')) {
        setVideoSource('upload');
      }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'thumbnail' | 'previewVideoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
       setError(`File size exceeds the 100MB limit.`);
       return;
    }

    try {
      if (field === 'thumbnail') setUploadingThumbnail(true);
      if (field === 'previewVideoUrl') setUploadingVideo(true);
      setError('');

      const res = await uploadCourseMedia(file);
      setFormData((prev) => ({
        ...prev,
        [field]: API_URL + res.url,
      }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to upload ${field}`);
    } finally {
      if (field === 'thumbnail') setUploadingThumbnail(false);
      if (field === 'previewVideoUrl') setUploadingVideo(false);
      // Reset input value so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleRemoveMedia = async (field: 'thumbnail' | 'previewVideoUrl') => {
    const url = formData[field];
    if (!url) return;

    try {
      if (url.includes('/uploads/')) {
        await deleteCourseMedia(url);
      }
      setFormData((prev) => ({ ...prev, [field]: '' }));
    } catch (err: unknown) {
      console.error('Remove media error:', err);
      setFormData((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title?.trim()) { setError('Title is required'); return; }
    if (formData.title.length > 200) { setError('Title must be less than 200 characters'); return; }
    if (!formData.description?.trim()) { setError('Description is required'); return; }
    if (formData.description.length > 5000) { setError('Description must be less than 5000 characters'); return; }

    try {
      setSaving(true);
      await updateCourse(courseId, formData);
      alert('Course updated successfully!');
      loadCourse();
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
    if (!confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) return;
    const confirmText = prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') return;

    try {
      await deleteCourse(courseId);
      alert('Course deleted successfully');
      router.push('/instructor/courses');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete course');
    }
  };

  const inputClasses = "w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm";

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

  if (error && !course) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-slate-700 text-sm mb-4">{error}</p>
          <Link href="/instructor/courses" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Courses
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isOwner = user?.id === course?.instructor?.id || user?.role === 'admin';
  if (!isOwner) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p className="text-slate-700 text-sm mb-4">You don&apos;t have permission to edit this course.</p>
          <Link href="/instructor/courses" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Courses
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/instructor/courses" className="text-slate-400 hover:text-slate-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Course</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Last updated: {new Date(course?.updatedAt || '').toLocaleDateString()}
            </p>
          </div>
        </div>
        {course?.isPublished ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Published
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Draft
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8 items-start">
        <div className="space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}

        {/* Stats */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Course Stats</h2>
            <Link
              href={`/instructor/courses/${courseId}/lessons`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Manage Lessons
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-slate-900">{course?.enrollmentCount || 0}</div>
              <div className="text-xs text-slate-500">Students</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{course?.lessons?.length || 0}</div>
              <div className="text-xs text-slate-500">Lessons</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">${course?.price ? Number(course.price).toFixed(2) : '0.00'}</div>
              <div className="text-xs text-slate-500">Price</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required maxLength={200} className={inputClasses} />
            <p className="mt-1 text-xs text-slate-400">{formData.title?.length || 0}/200 characters</p>
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1.5">
              Course Slug <span className="text-red-500">*</span>
            </label>
            <input type="text" id="slug" name="slug" value={formData.slug} onChange={handleChange} required pattern="[a-z0-9\-]+" className={inputClasses} />
            <p className="mt-1 text-xs text-slate-400">URL-friendly version</p>
          </div>

          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
            <input type="text" id="shortDescription" name="shortDescription" value={formData.shortDescription} onChange={handleChange} maxLength={200} className={inputClasses} />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Description <span className="text-red-500">*</span>
            </label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows={8} maxLength={5000} className={inputClasses} />
            <p className="mt-1 text-xs text-slate-400">{formData.description?.length || 0}/5000 characters</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            <div>
              <label htmlFor="medium" className="block text-sm font-medium text-slate-700 mb-1.5">
                Course Medium <span className="text-red-500">*</span>
              </label>
              <select id="medium" name="medium" value={formData.medium} onChange={handleChange} required className={inputClasses}>
                <option value="english">English</option>
                <option value="sinhala">Sinhala</option>
                <option value="tamil">Tamil</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1.5">
              Price (USD) <span className="text-red-500">*</span>
            </label>
            <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" required className={inputClasses} />
            <p className="mt-1 text-xs text-slate-400">Set to 0 for free courses</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="thumbnail" className="block text-sm font-medium text-slate-700">Thumbnail Image</label>
              <select 
                value={thumbnailSource} 
                onChange={(e) => setThumbnailSource(e.target.value as 'url' | 'upload')}
                className="text-xs border border-slate-300 rounded-md px-2 py-1 outline-none text-slate-600 bg-white cursor-pointer"
              >
                <option value="url">Enter URL</option>
                <option value="upload">Upload File</option>
              </select>
            </div>
            
            {thumbnailSource === 'url' ? (
              <input type="url" id="thumbnail" name="thumbnail" value={formData.thumbnail} onChange={handleChange} className={inputClasses} placeholder="https://..." />
            ) : (
              <div className="flex gap-2">
                <input type="text" readOnly value={formData.thumbnail || ''} className={`${inputClasses} bg-slate-50 text-slate-500 font-normal`} placeholder="No file chosen" />
                <label className={`flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-slate-50 hover:bg-slate-100 cursor-pointer transition whitespace-nowrap ${uploadingThumbnail ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploadingThumbnail ? 'Uploading...' : 'Browse'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'thumbnail')} disabled={uploadingThumbnail} />
                </label>
              </div>
            )}
            {formData.thumbnail && (
              <div className="mt-3 relative group">
                <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                  <Image 
                    src={formData.thumbnail} 
                    alt="Thumbnail preview" 
                    fill 
                    className="object-cover" 
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => handleRemoveMedia('thumbnail')}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  title="Remove Image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="previewVideoUrl" className="block text-sm font-medium text-slate-700">Preview Video</label>
              <select 
                value={videoSource} 
                onChange={(e) => setVideoSource(e.target.value as 'url' | 'upload')}
                className="text-xs border border-slate-300 rounded-md px-2 py-1 outline-none text-slate-600 bg-white cursor-pointer"
              >
                <option value="url">Enter URL</option>
                <option value="upload">Upload File</option>
              </select>
            </div>
            
            {videoSource === 'url' ? (
              <input type="url" id="previewVideoUrl" name="previewVideoUrl" value={formData.previewVideoUrl} onChange={handleChange} className={inputClasses} placeholder="https://..." />
            ) : (
              <div className="flex gap-2">
                <input type="text" readOnly value={formData.previewVideoUrl || ''} className={`${inputClasses} bg-slate-50 text-slate-500 font-normal`} placeholder="No file chosen" />
                <label className={`flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-slate-50 hover:bg-slate-100 cursor-pointer transition whitespace-nowrap ${uploadingVideo ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploadingVideo ? 'Uploading...' : 'Browse'}
                  <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => handleFileUpload(e, 'previewVideoUrl')} disabled={uploadingVideo} />
                </label>
              </div>
            )}
            {formData.previewVideoUrl && (
              <div className="mt-3 relative group">
                <div className="w-full h-auto rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                  <video src={formData.previewVideoUrl} controls className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }} />
                </div>
                <button 
                  type="button"
                  onClick={() => handleRemoveMedia('previewVideoUrl')}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                  title="Remove Video"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-5 border-t border-slate-100">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/instructor/courses"
              className="px-6 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
              Cancel
            </Link>
          </div>
        </form>

        {/* Publishing */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Publishing</h2>
          <p className="text-slate-500 mb-4 text-sm">
            {course?.isPublished
              ? 'This course is currently published and visible to students.'
              : 'This course is currently a draft and not visible to students.'}
          </p>
          <button
            onClick={handleTogglePublish}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition shadow-sm ${course?.isPublished
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
          >
            {course?.isPublished ? 'Unpublish Course' : 'Publish Course'}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border-2 border-red-200 shadow-sm p-6 mt-6">
          <h2 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h2>
          <p className="text-slate-500 mb-4 text-sm">
            Once you delete a course, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDelete}
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition shadow-sm"
          >
            Delete Course
          </button>
        </div>
        </div>
        
        {/* RIGHT COLUMN: Modern Manage Lessons Panel */}
        <div className="xl:sticky xl:top-24 z-10">
          <ManageLessonsInline courseId={courseId} />
        </div>
      </div>
    </AppLayout>
  );
}

export default function EditCoursePage() {
  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <EditCourseContent />
    </ProtectedRoute>
  );
}
