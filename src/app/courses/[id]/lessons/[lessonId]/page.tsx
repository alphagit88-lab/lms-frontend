'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getCourseById, Course, Lesson } from '@/lib/api/courses';

const API_BASE_URL = typeof window !== "undefined" ? "/proxied-backend" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

async function getLessonById(lessonId: string): Promise<Lesson> {
    const res = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, {
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load lesson');
    }
    const data = await res.json();
    return data.lesson ?? data;
}

export default function LessonViewerPage() {
    const params = useParams();
    const courseId = params.id as string;
    const lessonId = params.lessonId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);

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
            const [courseData, lessonData] = await Promise.all([
                getCourseById(courseId),
                getLessonById(lessonId),
            ]);
            // Final guard: if somehow the backend let a non-enrolled student through
            // (shouldn't happen, but belt-and-suspenders)
            if (!courseData.isEnrolled) {
                const lesson = lessonData as Lesson & { isPreview?: boolean };
                if (!lesson.isPreview) {
                    setAccessDenied(true);
                    setCourse(courseData);
                    return;
                }
            }
            setCourse(courseData);
            setLesson(lessonData);
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

    const sortedLessons = course?.lessons?.filter(l => l.isPublished).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
    const currentIndex = sortedLessons.findIndex(l => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null;

    const renderVideo = (url: string) => {
        // YouTube
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
        // Vimeo
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
        // Direct video file or backend-served video
        const videoSrc = url.startsWith('http') ? url : `${API_BASE_URL}/${url.replace(/^\//, '')}`;
        return (
            <video controls className="w-full h-full" key={videoSrc}>
                <source src={videoSrc} />
                Your browser does not support the video tag.
            </video>
        );
    };

    return (
        <ProtectedRoute>
            <AppLayout>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <div className="w-10 h-10 border-4 border-slate-900 border-t-blue-600 rounded-full animate-spin mb-4" />
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Loading Lesson…</p>
                    </div>
                ) : accessDenied ? (
                    <div className="max-w-lg mx-auto mt-20 text-center">
                        <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-sm">
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Enrollment Required</h2>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                                This lesson is only available to enrolled students.<br />
                                Enroll in the course to unlock full access.
                            </p>
                            <Link
                                href={`/courses/${courseId}`}
                                className="inline-block px-8 py-3.5 bg-blue-600 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-blue-700 transition"
                            >
                                View Course &amp; Enroll
                            </Link>
                        </div>
                    </div>
                ) : error ? (
                    <div className="max-w-xl mx-auto mt-20 text-center bg-red-50 border border-red-100 rounded-3xl p-12">
                        <p className="text-red-600 font-bold text-lg mb-2">Unable to Load Lesson</p>
                        <p className="text-red-500 text-sm mb-8">{error}</p>
                        <Link
                            href={`/courses/${courseId}`}
                            className="px-8 py-3.5 bg-slate-900 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-blue-600 transition"
                        >
                            Back to Course
                        </Link>
                    </div>
                ) : lesson && (
                    <div className="max-w-6xl mx-auto">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
                            <Link href="/student/my-courses" className="hover:text-blue-600 transition">My Learning</Link>
                            <span>/</span>
                            <Link href={`/courses/${courseId}`} className="hover:text-blue-600 transition">{course?.title}</Link>
                            <span>/</span>
                            <span className="text-slate-600">{lesson.title}</span>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            {/* Main content */}
                            <div className="xl:col-span-2 flex flex-col gap-6">
                                {/* Video player */}
                                {lesson.videoUrl ? (
                                    <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                                        {renderVideo(lesson.videoUrl)}
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                                        <div className="text-center">
                                            <svg className="w-16 h-16 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.847v6.306a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-slate-400 text-sm font-medium">No video for this lesson</p>
                                        </div>
                                    </div>
                                )}

                                {/* Lesson info */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                                            Lesson {currentIndex + 1} of {sortedLessons.length}
                                        </span>
                                        {lesson.durationMinutes > 0 && (
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                                                {lesson.durationMinutes} min
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-2xl font-bold text-slate-900 mb-4">{lesson.title}</h1>

                                    {lesson.content && (
                                        <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap border-t border-slate-100 pt-6 mt-4">
                                            {lesson.content}
                                        </div>
                                    )}
                                </div>

                                {/* Prev / Next navigation */}
                                <div className="flex items-center justify-between gap-4">
                                    {prevLesson ? (
                                        <Link
                                            href={`/courses/${courseId}/lessons/${prevLesson.id}`}
                                            className="flex items-center gap-3 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition text-sm font-semibold text-slate-700 flex-1"
                                        >
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            <span className="truncate">{prevLesson.title}</span>
                                        </Link>
                                    ) : <div className="flex-1" />}

                                    {nextLesson ? (
                                        <Link
                                            href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                                            className="flex items-center gap-3 px-6 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition text-sm font-semibold flex-1 justify-end"
                                        >
                                            <span className="truncate">{nextLesson.title}</span>
                                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    ) : (
                                        <Link
                                            href={`/courses/${courseId}`}
                                            className="flex items-center gap-3 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition text-sm font-semibold flex-1 justify-end"
                                        >
                                            <span>Course Complete!</span>
                                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar: lesson list */}
                            <div className="xl:col-span-1">
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
                                    <div className="px-6 py-5 border-b border-slate-100">
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course Content</h3>
                                        <p className="text-sm font-semibold text-slate-900 mt-1">{course?.title}</p>
                                    </div>
                                    <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
                                        {sortedLessons.map((l, idx) => (
                                            <Link
                                                key={l.id}
                                                href={`/courses/${courseId}/lessons/${l.id}`}
                                                className={`flex items-center gap-3 px-5 py-4 transition ${l.id === lessonId ? 'bg-blue-50 border-l-2 border-blue-600' : 'hover:bg-slate-50 border-l-2 border-transparent'}`}
                                            >
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${l.id === lessonId ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${l.id === lessonId ? 'text-blue-700' : 'text-slate-700'}`}>{l.title}</p>
                                                    {l.durationMinutes > 0 && (
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{l.durationMinutes} min</p>
                                                    )}
                                                </div>
                                                {l.id === lessonId && (
                                                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AppLayout>
        </ProtectedRoute>
    );
}
