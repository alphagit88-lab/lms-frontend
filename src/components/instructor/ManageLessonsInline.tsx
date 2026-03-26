import { useState, useEffect, useCallback, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import {
  getLessonsForCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  Lesson,
  CreateLessonData,
  UpdateLessonData,
} from '@/lib/api/courses';

// ── helpers ─────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Lesson Modal ─────────────────────────────────────────────────────
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
  lesson: Lesson | null;
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
          videoType: lesson.videoUrl && !lesson.videoUrl.startsWith('http') ? 'upload' : 'url',
          videoFile: null,
          durationMinutes: lesson.durationMinutes,
          isPreview: lesson.isPreview,
        });
        setSlugEdited(true);
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
      
      let finalVideoUrl = form.videoType === 'url' ? (form.videoUrl.trim() || undefined) : undefined;

      // Handle direct file upload to Vercel Blob (client-side)
      if (form.videoType === 'upload' && form.videoFile) {
        // Upload to Vercel Blob
        const blob = await upload(form.videoFile.name, form.videoFile, {
          access: 'public',
          handleUploadUrl: '/proxied-backend/api/upload/blob',
        });
        finalVideoUrl = blob.url;
      }

      await onSave({
        title: form.title.trim(),
        slug: form.slug.trim(),
        content: form.content.trim() || undefined,
        videoUrl: finalVideoUrl,
        videoFile: undefined, // Don't send file to backend
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
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm';

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 mt-16">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {lesson ? 'Edit Lesson' : 'Add New Lesson'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill in the details for this course module</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto w-full max-h-[calc(90vh-140px)]">
          <form id="lesson-form" onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Lesson Title <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.title} onChange={(e) => handleTitleChange(e.target.value)}
                required maxLength={200} placeholder="e.g. Setting up your environment" className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Slug URL <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.slug} onChange={(e) => handleSlugChange(e.target.value)}
                required placeholder="setting-up-environment" className={inputCls} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="sm:col-span-2 flex items-center gap-6 pb-1">
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

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {form.videoType === 'url' ? 'Video URL' : 'Video File'}
                </label>
                {form.videoType === 'url' ? (
                  <input type="url" value={form.videoUrl} onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
                    placeholder="https://youtube.com/..." className={inputCls} />
                ) : (
                  <div className="relative">
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
                        file:rounded-xl file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-1"
                    />
                     {lesson?.videoUrl && !lesson.videoUrl.startsWith('http') && !form.videoFile && (
                      <p className="mt-1 text-xs text-slate-500">
                        Current file: {lesson.videoUrl.split('/').pop()}
                      </p>
                    )}
                  </div>
                )}
                 <p className="mt-1 text-xs text-slate-400">
                  {form.videoType === 'url' ? 'YouTube, Vimeo, or direct link' : 'Max 100MB. MP4, WebM'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration <span className="text-slate-400 font-normal">(mins)</span></label>
                <input type="number" value={form.durationMinutes}
                  onChange={(e) => setForm((p) => ({ ...p, durationMinutes: parseInt(e.target.value, 10) || 0 }))}
                  min={0} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description / Notes</label>
              <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={3} placeholder="Optional instructions or notes..." className={inputCls} />
            </div>

            <div className="bg-purple-50/50 border border-purple-100/50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex items-center h-5">
                  <input type="checkbox" checked={form.isPreview}
                    onChange={(e) => setForm((p) => ({ ...p, isPreview: e.target.checked }))}
                    className="w-4.5 h-4.5 text-purple-600 border-slate-300 rounded focus:ring-purple-500" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">Make this a Free Preview</span>
                  <span className="text-xs text-slate-500">Unregistered users can watch this lesson to preview your course.</span>
                </div>
              </label>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end mt-auto">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
            Cancel
          </button>
          <button type="submit" form="lesson-form" disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center min-w-30">
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                Saving...
              </span>
            ) : lesson ? 'Update Lesson' : 'Add Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Manage Lessons Panel ──────────────────────────────────────────────

interface ManageLessonsInlineProps {
  courseId: string;
}

export default function ManageLessonsInline({ courseId }: ManageLessonsInlineProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLessonsForCourse(courseId);
      setLessons(data);
    } catch {
      // Intentionally swallow error; parent form already alerts heavily
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

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
      setLessons((prev) => prev.map((l) => (l.id === lesson.id ? { ...l, isPublished: !l.isPublished } : l)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update lesson');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!confirm(`Are you sure you want to delete "${lesson.title}"?`)) return;
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
    } catch { alert('Failed to reorder'); }
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
    } catch { alert('Failed to reorder'); }
  };

  const publishedCount = lessons.filter((l) => l.isPublished).length;

  return (
    <>
      <LessonModal
        open={modalOpen}
        lesson={editingLesson}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] flex flex-col xl:h-[calc(100vh-8rem)] overflow-hidden">
        {/* Modern Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <h2 className="text-[15px] font-bold text-slate-900">Course Curriculum</h2>
            </div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {lessons.length} Modules · {publishedCount} Published
            </p>
          </div>
          <button
            onClick={() => { setEditingLesson(null); setModalOpen(true); }}
            className="flex items-center justify-center p-2 rounded-xl bg-white text-blue-600 border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all hover:scale-105"
            title="Add Lesson"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 bg-slate-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
              <p className="text-sm font-medium">Loading curriculum...</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl m-2 bg-white">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">Build Your Curriculum</h3>
              <p className="text-xs text-slate-500 mb-6 max-w-50">Start adding lessons, articles, or videos to your course.</p>
              <button
                onClick={() => { setEditingLesson(null); setModalOpen(true); }}
                className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-md"
              >
                + Add First Module
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="group relative bg-white border border-slate-200/80 rounded-[14px] p-3 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                >
                  {/* Decorative line denoting publish status */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${lesson.isPublished ? 'bg-emerald-400' : 'bg-amber-300'}`} />

                  {/* Move Up/Down Controls */}
                  <div className="flex flex-col gap-0.5 shrink-0 pl-1">
                    <button onClick={() => handleMoveUp(index)} disabled={index === 0}
                      className="text-slate-300 hover:text-slate-600 disabled:opacity-20 transition" title="Move up">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button onClick={() => handleMoveDown(index)} disabled={index === lessons.length - 1}
                      className="text-slate-300 hover:text-slate-600 disabled:opacity-20 transition" title="Move down">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>

                  {/* Icon */}
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${lesson.videoUrl ? 'bg-blue-50/50 border-blue-100 text-blue-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    {lesson.videoUrl ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-[13px] font-semibold text-slate-800 truncate pr-2" title={lesson.title}>
                        {lesson.title}
                      </h4>
                      {lesson.isPreview && (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-purple-100 text-purple-700">Free</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                       {lesson.durationMinutes > 0 ? (
                         <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           {lesson.durationMinutes} min
                         </span>
                       ) : (
                         <span className="text-[11px] font-medium text-slate-400">Written</span>
                       )}
                       <span className="w-1 h-1 rounded-full bg-slate-200" />
                       <span className={`text-[11px] font-medium flex items-center gap-1 ${lesson.isPublished ? 'text-emerald-600' : 'text-amber-600'}`}>
                         {lesson.isPublished ? 'Live' : 'Draft'}
                       </span>
                    </div>
                  </div>

                  {/* Context Menu Actions (Always visible on mobile, hover on desktop) */}
                  <div className="flex items-center gap-0.5 xl:opacity-0 xl:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 bg-white shadow-[-10px_0_10px_white]">
                    <button
                      onClick={() => handleTogglePublish(lesson)}
                      disabled={togglingId === lesson.id}
                      title={lesson.isPublished ? 'Unpublish' : 'Publish'}
                      className={`p-2 rounded-lg transition-colors ${
                        lesson.isPublished
                          ? 'text-amber-500 hover:bg-amber-50'
                          : 'text-emerald-500 hover:bg-emerald-50'
                      } disabled:opacity-50`}
                    >
                      {togglingId === lesson.id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                      ) : lesson.isPublished ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                    <button onClick={() => { setEditingLesson(lesson); setModalOpen(true); }} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(lesson)} disabled={deletingId === lesson.id} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50" title="Delete">
                      {deletingId === lesson.id ? (
                         <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                      ) : (
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
