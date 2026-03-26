'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getCourseById,
  getLessonsForCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  Course,
  Lesson,
  CreateLessonData,
  UpdateLessonData,
} from '@/lib/api/courses';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

// ── helpers ────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── sub-components ─────────────────────────────────────────────────

interface LessonFormState {
  title: string;
  slug: string;
  content: string;
  videoUrl: string;
  videoType: 'url' | 'upload';
  videoFile: File | null;
  durationMinutes: number;
  isPreview: boolean;
}

const emptyForm: LessonFormState = {
  title: '',
  slug: '',
  content: '',
  videoUrl: '',
  videoType: 'url',
  videoFile: null,
  durationMinutes: 0,
  isPreview: false,
};

interface LessonModalProps {
  open: boolean;
  lesson: Lesson | null; // null = create mode
  onClose: () => void;
  onSave: (data: CreateLessonData | UpdateLessonData) => Promise<void>;
}

function LessonModal({ open, lesson, onClose, onSave }: LessonModalProps) {
  const [form, setForm] = useState<LessonFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (lesson) {
        setForm({
          title: lesson.title,
          slug: lesson.slug,
          content: lesson.content || '',
          videoUrl: lesson.videoUrl || '',
          videoType: 'url',
          videoFile: null,
          durationMinutes: lesson.durationMinutes || 0,
          isPreview: lesson.isPreview,
        });
        setSlugEdited(true); // don't auto-generate on edit
      } else {
        setForm(emptyForm);
        setSlugEdited(false);
      }
      setError('');
    }
  }, [open, lesson]);

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugEdited ? prev.slug : slugify(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugEdited(true);
    setForm((prev) => ({ ...prev, slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.slug.trim()) { setError('Slug is required'); return; }

    try {
      setSaving(true);
      await onSave({
        title: form.title.trim(),
        slug: form.slug.trim(),
        content: form.content.trim() || undefined,
        videoUrl: form.videoType === 'url' ? (form.videoUrl.trim() || undefined) : undefined,
        videoFile: form.videoType === 'upload' ? (form.videoFile || undefined) : undefined,
        durationMinutes: Number(form.durationMinutes) || 0,
        isPreview: form.isPreview,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputCls =
    'w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {lesson ? 'Edit Lesson' : 'Add New Lesson'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition rounded-lg p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Lesson Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              maxLength={200}
              placeholder="e.g. Introduction to Machine Learning"
              className={inputCls}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              placeholder="intro-to-machine-learning"
              className={inputCls}
            />
            <p className="mt-1 text-xs text-slate-400">Auto-generated from title; lowercase letters, numbers, and hyphens only.</p>
          </div>

          {/* Video URL / Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Video Content</label>
            
            <div className="flex items-center gap-6 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="videoType"
                  checked={form.videoType === 'url'}
                  onChange={() => setForm(p => ({ ...p, videoType: 'url' }))}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Video URL</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="videoType"
                  checked={form.videoType === 'upload'}
                  onChange={() => setForm(p => ({ ...p, videoType: 'upload' }))}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Upload Video</span>
              </label>
            </div>

            {form.videoType === 'url' ? (
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                className={inputCls}
              />
            ) : (
              <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
                 <input
                  type="file"
                  accept="video/*"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setForm(p => ({ ...p, videoFile: file }));
                  }}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-100 file:text-blue-700
                    hover:file:bg-blue-200
                    cursor-pointer"
                />
                {lesson?.videoUrl && !lesson.videoUrl.startsWith('http') && !form.videoFile && (
                  <p className="mt-2 text-xs text-slate-500">
                    Currently using uploaded file. Upload new one to replace.
                  </p>
                )}
              </div>
            )}
            
            <p className="mt-1 text-xs text-slate-400">
              {form.videoType === 'url' 
                ? 'YouTube, Vimeo, or direct video link.' 
                : 'Max size 100MB. MP4, WebM supported.'}
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration (minutes)</label>
            <input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm((p) => ({ ...p, durationMinutes: parseInt(e.target.value, 10) || 0 }))}
              min={0}
              className={inputCls}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Lesson Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              rows={6}
              placeholder="Write lesson notes, description, or text content here..."
              className={inputCls}
            />
          </div>

          {/* Free preview toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPreview}
              onChange={(e) => setForm((p) => ({ ...p, isPreview: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded"
            />
            <span className="text-sm text-slate-700">
              Free preview{' '}
              <span className="text-slate-400">(visible without enrollment)</span>
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-sm"
            >
              {saving ? 'Saving...' : lesson ? 'Save Changes' : 'Add Lesson'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── main page component ────────────────────────────────────────────

function ManageLessonsContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [courseData, lessonsData] = await Promise.all([
        getCourseById(courseId),
        getLessonsForCourse(courseId),
      ]);
      setCourse(courseData);
      setLessons(lessonsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  // ── handlers ──────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setEditingLesson(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setModalOpen(true);
  };

  const handleSave = async (data: CreateLessonData | UpdateLessonData) => {
    if (editingLesson) {
      await updateLesson(editingLesson.id, data as UpdateLessonData);
    } else {
      await createLesson(courseId, data as CreateLessonData);
    }
    await load();
  };

  const handleTogglePublish = async (lesson: Lesson) => {
    setTogglingId(lesson.id);
    try {
      await updateLesson(lesson.id, { isPublished: !lesson.isPublished });
      setLessons((prev) =>
        prev.map((l) => (l.id === lesson.id ? { ...l, isPublished: !l.isPublished } : l))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update lesson');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!confirm(`Delete "${lesson.title}"? This cannot be undone.`)) return;
    setDeletingId(lesson.id);
    try {
      await deleteLesson(lesson.id);
      setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete lesson');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const lesson = lessons[index];
    const above = lessons[index - 1];
    try {
      await Promise.all([
        updateLesson(lesson.id, { sortOrder: above.sortOrder }),
        updateLesson(above.id, { sortOrder: lesson.sortOrder }),
      ]);
      const updated = [...lessons];
      updated[index] = { ...lesson, sortOrder: above.sortOrder };
      updated[index - 1] = { ...above, sortOrder: lesson.sortOrder };
      updated.sort((a, b) => a.sortOrder - b.sortOrder);
      setLessons(updated);
    } catch {
      alert('Failed to reorder lessons');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === lessons.length - 1) return;
    const lesson = lessons[index];
    const below = lessons[index + 1];
    try {
      await Promise.all([
        updateLesson(lesson.id, { sortOrder: below.sortOrder }),
        updateLesson(below.id, { sortOrder: lesson.sortOrder }),
      ]);
      const updated = [...lessons];
      updated[index] = { ...lesson, sortOrder: below.sortOrder };
      updated[index + 1] = { ...below, sortOrder: lesson.sortOrder };
      updated.sort((a, b) => a.sortOrder - b.sortOrder);
      setLessons(updated);
    } catch {
      alert('Failed to reorder lessons');
    }
  };

  // ── loading / error states ─────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-3 text-sm text-slate-500">Loading lessons...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error && !course) {
    return (
      <AppLayout>
        <div className="text-center py-20">
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
    router.push('/instructor/courses');
    return null;
  }

  const publishedCount = lessons.filter((l) => l.isPublished).length;

  // ── render ─────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <LessonModal
        open={modalOpen}
        lesson={editingLesson}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/instructor/courses/${courseId}/edit`}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manage Lessons</h1>
            <p className="text-sm text-slate-500 mt-0.5 truncate max-w-xs sm:max-w-sm">{course?.title}</p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Lesson
        </button>
      </div>

      {/* Stats bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-slate-900">{lessons.length}</div>
            <div className="text-xs text-slate-500">Total Lessons</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{publishedCount}</div>
            <div className="text-xs text-slate-500">Published</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-500">{lessons.length - publishedCount}</div>
            <div className="text-xs text-slate-500">Drafts</div>
          </div>
        </div>
      </div>

      {/* Lessons list */}
      {lessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-slate-500 text-sm mb-4">No lessons yet. Add your first lesson to get started.</p>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            Add First Lesson
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4"
            >
              {/* Order controls */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-25 transition"
                  title="Move up"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className="text-xs text-slate-400 text-center w-5">{index + 1}</span>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === lessons.length - 1}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-25 transition"
                  title="Move down"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Lesson icon */}
              <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                {lesson.videoUrl ? (
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-900 truncate">{lesson.title}</span>
                  {lesson.isPreview && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      Free Preview
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      lesson.isPublished
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        lesson.isPublished ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    {lesson.isPublished ? 'Published' : 'Draft'}
                  </span>
                  {lesson.durationMinutes > 0 && (
                    <span className="text-xs text-slate-400">{lesson.durationMinutes} min</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Publish toggle */}
                <button
                  onClick={() => handleTogglePublish(lesson)}
                  disabled={togglingId === lesson.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    lesson.isPublished
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {togglingId === lesson.id
                    ? '...'
                    : lesson.isPublished
                    ? 'Unpublish'
                    : 'Publish'}
                </button>

                {/* Edit */}
                <button
                  onClick={() => handleOpenEdit(lesson)}
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                  title="Edit lesson"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(lesson)}
                  disabled={deletingId === lesson.id}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  title="Delete lesson"
                >
                  {deletingId === lesson.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer tip */}
      {lessons.length > 0 && (
        <p className="mt-4 text-xs text-slate-400 text-center">
          Students can only see published lessons. Use the Publish button to make a lesson visible.
        </p>
      )}
    </AppLayout>
  );
}

export default function ManageLessonsPage() {
  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <ManageLessonsContent />
    </ProtectedRoute>
  );
}
