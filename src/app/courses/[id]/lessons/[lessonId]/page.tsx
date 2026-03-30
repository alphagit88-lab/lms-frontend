'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getCourseById, Course, Lesson } from '@/lib/api/courses';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = typeof window !== "undefined" ? "/proxied-backend" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

interface LessonProgress {
    lessonId: string;
    isCompleted: boolean;
}

async function getLessonById(lessonId: string): Promise<{ lesson: Lesson; progress?: LessonProgress }> {
    const res = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, {
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load lesson');
    }
    return await res.json();
}

export default function LessonViewerPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const lessonId = params.lessonId as string;
    const { user } = useAuth();

    const [course, setCourse] = useState<Course | null>(null);
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
    const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);
    const [updatingProgress, setUpdatingProgress] = useState(false);

    useEffect(() => {
        if (courseId && lessonId) {
            load();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId, lessonId]);

    const load = async () => {
        setLoading(true);
        setError('');
        setAccessDenied(false);
        try {
            const courseRes = await getCourseById(courseId);
            const lessonRes = await getLessonById(lessonId);

            // Fetch course data which now includes our specific enrollment info
            // (The API was updated to return enrollmentId and lessonProgress for the current user)
            const extendedCourseRes = courseRes as any;

            setCourse(courseRes);
            setLesson(lessonRes.lesson);
            if (extendedCourseRes.lessonProgress) {
                setLessonProgress(extendedCourseRes.lessonProgress);
            }
            if (extendedCourseRes.enrollmentId) {
                setEnrollmentId(extendedCourseRes.enrollmentId);
            }

            // Authorization guard
            const isInstructor = user?.id === courseRes.instructorId;
            const isAdmin = user?.role === 'admin';
            
            if (!courseRes.isEnrolled && !isInstructor && !isAdmin) {
                if (!lessonRes.lesson.isPreview) {
                    setAccessDenied(true);
                }
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load lesson';
            if (
                msg.toLowerCase().includes('enrollment') ||
                msg.toLowerCase().includes('access denied') ||
                msg.toLowerCase().includes('forbidden')
            ) {
                setAccessDenied(true);
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const isInstructor = user?.id === course?.instructorId;
    const isAdmin = user?.role === 'admin';

    // Calculate current lesson index and next/prev for navigation
    // NOTE: We don't filter out unpublished lessons for instructors/admins
    // We also ENSURE the current lesson is always in the list if it's not filtered out
    const allLessons = course?.lessons || [];
    const filteredSortedLessons = allLessons
        .filter(l => l.isPublished || isInstructor || isAdmin)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    
    // Fallback: If filteredSortedLessons is empty but we HAVE a lesson (which means user has access), add it!
    const sortedLessons = (filteredSortedLessons.length === 0 && lesson) 
        ? [lesson] 
        : filteredSortedLessons;

    const currentIndex = sortedLessons.findIndex(l => l.id === lessonId);
    const nextLesson = currentIndex !== -1 && currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null;

    const markAsCompleted = async () => {
        if (!enrollmentId || !lessonId || updatingProgress) return;

        setUpdatingProgress(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/enrollments/${enrollmentId}/lessons/${lessonId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted: true }),
                credentials: 'include',
            });

            if (res.ok) {
                // Update local status
                setLessonProgress(prev => {
                    const existing = prev.find(p => p.lessonId === lessonId);
                    if (existing) {
                        return prev.map(p => p.lessonId === lessonId ? { ...p, isCompleted: true } : p);
                    }
                    return [...prev, { lessonId, isCompleted: true }];
                });

                // Auto-advance if next lesson exists
                if (nextLesson) {
                    router.push(`/courses/${courseId}/lessons/${nextLesson.id}`);
                }
            }
        } catch (err) {
            console.error('Failed to update progress:', err);
        } finally {
            setUpdatingProgress(false);
        }
    };

    const renderVideo = (url: string) => {
        const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
        if (ytMatch) {
            return (
                <iframe
                    src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            );
        }
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            return (
                <iframe
                    src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture"
                />
            );
        }
        const videoSrc = url.startsWith('http') ? url : `${API_BASE_URL}/${url.replace(/^\//, '')}`;
        return (
            <video controls className="w-full h-full" key={videoSrc}>
                <source src={videoSrc} />
                Your browser does not support the video tag.
            </video>
        );
    };

    const isCurrentCompleted = lessonProgress.some(p => p.lessonId === lessonId && p.isCompleted);

    return (
        <ProtectedRoute>
            <AppLayout>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-6" />
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] animate-pulse">Loading Lesson Flow…</p>
                    </div>
                ) : accessDenied ? (
                    <div className="max-w-2xl mx-auto mt-20 text-center">
                        <div className="bg-white border border-slate-100 rounded-[40px] p-16 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
                            <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110 duration-500">
                                <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Access Restricted</h2>
                            <p className="text-slate-500 text-lg mb-10 leading-relaxed max-w-md mx-auto">
                                This premium content is reserved for enrolled students. Unlock your full potential today.
                            </p>
                            <Link
                                href={`/courses/${courseId}`}
                                className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition active:scale-95"
                            >
                                Enroll Now
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                ) : error ? (
                    <div className="max-w-2xl mx-auto mt-20 text-center">
                        <div className="bg-white border border-red-100 rounded-[40px] p-16 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
                            <h2 className="text-red-600 font-black text-2xl mb-4">Connection Issue</h2>
                            <p className="text-slate-500 text-lg mb-10">{error}</p>
                            <button
                                onClick={load}
                                className="px-10 py-5 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-red-600 transition shadow-xl shadow-slate-100"
                            >
                                Retry Connection
                            </button>
                        </div>
                    </div>
                ) : lesson && (
                    <div className="max-w-[1600px] mx-auto px-4 py-8">
                        {/* Header: Breadcrumbs & Current Lesson Title */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                <Link href="/dashboard" className="hover:text-blue-600 transition">My Learning</Link>
                                <span>/</span>
                                <Link href={`/courses/${courseId}`} className="hover:text-blue-600 transition">{course?.title || 'Course'}</Link>
                                <span>/</span>
                                <span className="text-slate-900 font-bold">{lesson?.title}</span>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
                                            Lesson {Math.max(1, currentIndex + 1)} of {Math.max(sortedLessons.length, 1)}
                                        </span>
                                        {lesson?.isPreview && (
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                                                Free Preview
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                        {lesson?.title}
                                    </h1>
                                </div>
                                
                                {/* Complete Button Header (Quick Access) */}
                                {enrollmentId && !isCurrentCompleted && (
                                    <button 
                                        onClick={markAsCompleted}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 transition active:scale-95 flex items-center gap-2"
                                    >
                                        Mark as Completed
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                            {/* Main Content Area */}
                            <div className="xl:col-span-3 space-y-8">
                                {/* Video Player */}
                                <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative group">
                                    {lesson?.videoUrl ? (
                                        renderVideo(lesson.videoUrl)
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                                            <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <p className="font-medium text-lg italic">This lesson doesn't have a video yet.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Lesson Description & Content */}
                                <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-sm">
                                    <div className="prose prose-slate max-w-none prose-headings:font-black prose-p:text-slate-600 prose-p:leading-relaxed">
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-8 h-1 bg-blue-600 rounded-full" />
                                            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide m-0">About this lesson</h2>
                                        </div>
                                        {lesson?.content ? (
                                            <div 
                                                className="whitespace-pre-wrap text-slate-600 font-medium leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: lesson.content }} 
                                            />
                                        ) : (
                                            <p className="text-slate-400 italic">No description available for this lesson.</p>
                                        )}
                                    </div>

                                    {/* Flow Navigation Buttons */}
                                    <div className="mt-12 pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                                        {nextLesson ? (
                                            <button 
                                                onClick={markAsCompleted}
                                                className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-base shadow-xl shadow-blue-100 transition active:scale-[0.98] flex items-center justify-center gap-3"
                                            >
                                                Next Lesson: {nextLesson.title}
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <Link
                                                href={`/courses/${courseId}`}
                                                className="w-full sm:w-auto px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 transition active:scale-[0.98]"
                                            >
                                                <span>COURSE COMPLETED</span>
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </Link>
                                        )}
                                        
                                        {isCurrentCompleted && (
                                            <p className="text-sm font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Lesson completed successfully
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar: lesson list */}
                            <div className="xl:col-span-1">
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden sticky top-6">
                                    <div className="px-8 py-8 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Course Content</h3>
                                        <p className="text-xl font-black text-slate-900 mt-2 leading-tight">{course?.title}</p>
                                        <div className="flex items-center gap-3 mt-4 text-xs text-slate-500 font-bold">
                                            <span className="flex items-center gap-1 text-blue-600">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                                {sortedLessons.length} lessons
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                        {sortedLessons.map((l, idx) => {
                                            const isActive = l.id === lessonId;
                                            const lessonIsCompleted = lessonProgress.some(p => p.lessonId === l.id && p.isCompleted);
                                            
                                            return (
                                                <Link
                                                    key={l.id}
                                                    href={`/courses/${courseId}/lessons/${l.id}`}
                                                    className={`flex items-start gap-4 px-8 py-6 transition-all relative group ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50'}`}
                                                >
                                                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm transition-all ${
                                                        isActive 
                                                            ? 'bg-white/20 text-white' 
                                                            : lessonIsCompleted 
                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                                : 'bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100'
                                                    }`}>
                                                        {lessonIsCompleted ? (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        ) : idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                                                            Lesson {idx + 1}
                                                        </div>
                                                        <h4 className={`text-[15px] font-black leading-snug tracking-tight truncate ${isActive ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'}`}>
                                                            {l.title}
                                                        </h4>
                                                    </div>
                                                    {isActive && (
                                                        <div className="flex-shrink-0 animate-pulse">
                                                            <div className="w-2 h-2 rounded-full bg-white shadow-lg shadow-white/50" />
                                                        </div>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: #f8fafc;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #e2e8f0;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #cbd5e1;
                    }
                `}</style>
            </AppLayout>
        </ProtectedRoute>
    );
}
