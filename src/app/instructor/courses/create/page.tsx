'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createCourse, getCategories, Category, CreateCourseData, uploadCourseMedia, deleteCourseMedia } from '@/lib/api/courses';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function CreateCourseContent() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [thumbnailSource, setThumbnailSource] = useState<'url' | 'upload'>('url');
  const [videoSource, setVideoSource] = useState<'url' | 'upload'>('url');

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
    medium: 'english',
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

    if (!formData.title.trim()) { setError('Title is required'); return; }
    if (formData.title.length > 200) { setError('Title must be less than 200 characters'); return; }
    if (!formData.slug.trim()) { setError('Slug is required'); return; }
    if (!formData.description.trim()) { setError('Description is required'); return; }
    if (formData.description.length > 5000) { setError('Description must be less than 5000 characters'); return; }

    try {
      setLoading(true);
      const course = await createCourse(formData);
      router.push(`/instructor/courses/${course.id}/edit`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400";
  const labelClasses = "block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2";

  return (
    <AppLayout>
      <div className="w-full min-h-screen bg-slate-50">

        {/* Hero Header */}
        <div className="bg-linear-to-br from-slate-900 via-slate-800 to-blue-900 px-6 lg:px-10 pt-10 pb-20">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/instructor/courses"
              className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase">New Course</span>
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Create New Course</h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">Fill in the details below to publish your course to students.</p>
        </div>

        {/* Content */}
        <div className="px-6 lg:px-10 -mt-12 pb-12">

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm font-medium flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left — Main Info */}
              <div className="lg:col-span-2 space-y-5">

                {/* Basic Info Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">Basic Information</h2>
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <label htmlFor="title" className={labelClasses}>
                        Course Title <span className="text-red-500 normal-case">*</span>
                      </label>
                      <input type="text" id="title" name="title" value={formData.title} onChange={handleChange}
                        placeholder="e.g., Full Stack Web Development for Beginners"
                        required maxLength={200} className={inputClasses} />
                      <p className="mt-1.5 text-xs text-slate-400">{formData.title.length}/200 characters</p>
                    </div>

                    <div>
                      <label htmlFor="slug" className={labelClasses}>
                        Course Slug <span className="text-red-500 normal-case">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none">/</span>
                        <input type="text" id="slug" name="slug" value={formData.slug} onChange={handleChange}
                          placeholder="fullstack-web-development"
                          required pattern="[a-z0-9\-]+"
                          className={`${inputClasses} pl-7`} />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400">Lowercase letters, numbers, and hyphens only</p>
                    </div>

                    <div>
                      <label htmlFor="shortDescription" className={labelClasses}>Short Description</label>
                      <input type="text" id="shortDescription" name="shortDescription"
                        value={formData.shortDescription} onChange={handleChange}
                        placeholder="A brief one-liner shown in course listings"
                        maxLength={200} className={inputClasses} />
                      <p className="mt-1.5 text-xs text-slate-400">Optional · {(formData.shortDescription || '').length}/200</p>
                    </div>

                    <div>
                      <label htmlFor="description" className={labelClasses}>
                        Full Description <span className="text-red-500 normal-case">*</span>
                      </label>
                      <textarea id="description" name="description" value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe what students will learn, prerequisites, and outcomes..."
                        required rows={7} maxLength={5000}
                        className={`${inputClasses} resize-none`} />
                      <p className="mt-1.5 text-xs text-slate-400">{formData.description.length}/5000 characters</p>
                    </div>
                  </div>
                </div>

                {/* Media Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">Media</h2>
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="thumbnail" className={labelClasses.replace(' mb-2', '')}>Thumbnail Image</label>
                        <select 
                          value={thumbnailSource} 
                          onChange={(e) => setThumbnailSource(e.target.value as 'url' | 'upload')}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600 bg-slate-50 cursor-pointer focus:border-blue-500"
                        >
                          <option value="url">Enter URL</option>
                          <option value="upload">Upload File</option>
                        </select>
                      </div>
                      
                      {thumbnailSource === 'url' ? (
                        <input type="url" id="thumbnail" name="thumbnail" value={formData.thumbnail}
                          onChange={handleChange} placeholder="https://example.com/image.jpg" className={inputClasses} />
                      ) : (
                        <div className="flex gap-2">
                          <input type="text" readOnly value={formData.thumbnail || ''} className={`${inputClasses} text-slate-500 font-normal`} placeholder="No file chosen" />
                          <label className={`flex items-center justify-center px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 hover:bg-slate-100 cursor-pointer transition whitespace-nowrap ${uploadingThumbnail ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploadingThumbnail ? 'Uploading...' : 'Browse'}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'thumbnail')} disabled={uploadingThumbnail} />
                          </label>
                        </div>
                      )}
                      {formData.thumbnail && (
                        <div className="mt-3 relative group">
                          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                            <Image
                              src={formData.thumbnail}
                              alt="Thumbnail preview"
                              fill
                              className="object-cover"
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
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="previewVideoUrl" className={labelClasses.replace(' mb-2', '')}>Preview Video</label>
                        <select 
                          value={videoSource} 
                          onChange={(e) => setVideoSource(e.target.value as 'url' | 'upload')}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600 bg-slate-50 cursor-pointer focus:border-blue-500"
                        >
                          <option value="url">Enter URL</option>
                          <option value="upload">Upload File</option>
                        </select>
                      </div>
                      
                      {videoSource === 'url' ? (
                        <input type="url" id="previewVideoUrl" name="previewVideoUrl"
                          value={formData.previewVideoUrl} onChange={handleChange}
                          placeholder="https://youtube.com/watch?v=..." className={inputClasses} />
                      ) : (
                        <div className="flex gap-2">
                          <input type="text" readOnly value={formData.previewVideoUrl || ''} className={`${inputClasses} text-slate-500 font-normal`} placeholder="No file chosen" />
                          <label className={`flex items-center justify-center px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 hover:bg-slate-100 cursor-pointer transition whitespace-nowrap ${uploadingVideo ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploadingVideo ? 'Uploading...' : 'Browse'}
                            <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => handleFileUpload(e, 'previewVideoUrl')} disabled={uploadingVideo} />
                          </label>
                        </div>
                      )}
                      {formData.previewVideoUrl && (
                        <div className="mt-3 relative group">
                          <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
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
                      <p className="mt-1.5 text-xs text-slate-400">Shown to potential students before enrolling</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right — Settings */}
              <div className="space-y-5">

                {/* Course Settings */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">Course Settings</h2>
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <label htmlFor="categoryId" className={labelClasses}>Category</label>
                      <select id="categoryId" name="categoryId" value={formData.categoryId}
                        onChange={handleChange} className={inputClasses}>
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="level" className={labelClasses}>
                        Difficulty Level <span className="text-red-500 normal-case">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, level: lvl }))}
                            className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${
                              formData.level === lvl
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="medium" className={labelClasses}>
                        Course Medium <span className="text-red-500 normal-case">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['english', 'sinhala', 'tamil'] as const).map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, medium: lang }))}
                            className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${
                              formData.medium === lang
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">Pricing</h2>
                  </div>
                  <div className="p-6">
                    <label htmlFor="price" className={labelClasses}>
                      Price (LKR) <span className="text-red-500 normal-case">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">LKR</span>
                      <input type="number" id="price" name="price" value={formData.price}
                        onChange={handleChange} min="0" step="0.01" required
                        className={`${inputClasses} pl-14`} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      {[0, 999, 1999, 4999].map((p) => (
                        <button key={p} type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, price: p }))}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            formData.price === p
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}>
                          {p === 0 ? 'Free' : `${p}`}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Set to 0 to offer this course for free</p>
                  </div>
                </div>

                {/* Submit */}
                <div className="space-y-3">
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Creating Course...
                      </span>
                    ) : 'Create Course'}
                  </button>
                  <Link href="/instructor/courses"
                    className="w-full py-3.5 bg-white text-slate-600 border border-slate-200 rounded-2xl text-sm font-bold hover:bg-slate-50 transition text-center block">
                    Cancel
                  </Link>
                </div>

              </div>
            </div>
          </form>
        </div>
      </div>
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
