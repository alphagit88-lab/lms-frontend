'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getMyEnrollments, Enrollment } from '@/lib/api/enrollments';

export default function MyCoursesPage() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadEnrollments();
    }, []);

    const loadEnrollments = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getMyEnrollments();
            setEnrollments(data);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load your courses';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <AppLayout>
                {/* Header Section */}
                <div className="mb-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-semibold text-slate-900 tracking-tight">My Learning<span className="text-blue-600">.</span></h1>
                            <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-widest mt-2">Personal Academic Progress</p>
                        </div>
                        <Link
                            href="/courses"
                            className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-semibold uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-3 shadow-xl shadow-slate-900/10"
                        >
                            Discover More
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        </Link>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100">
                        <div className="w-12 h-12 border-4 border-slate-900 border-t-blue-600 rounded-full animate-spin mb-4" />
                        <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-widest">Accessing Curriculum...</p>
                    </div>
                ) : error ? (
                    <div className="p-10 bg-red-50 rounded-4xl border border-red-100 text-center">
                        <p className="text-red-600 font-bold mb-4">{error}</p>
                        <button onClick={loadEnrollments} className="px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-bold uppercase">Retry Sync</button>
                    </div>
                ) : enrollments.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm px-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100">
                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-slate-900 mb-2">No Active Enrollments</h3>
                        <p className="text-slate-400 font-medium mb-10 max-w-md mx-auto">You haven&apos;t joined any courses yet. Explore our certified curriculum and start your journey today.</p>
                        <Link href="/courses" className="px-10 py-5 bg-blue-600 text-white rounded-[20px] font-semibold uppercase text-[11px] tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-blue-500/20">
                            Browse Categories
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {enrollments.map((enrollment) => (
                            <div
                                key={enrollment.id}
                                className="group bg-white rounded-4xl border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col"
                            >
                                {/* Course Image / Placeholder */}
                                <div className="aspect-16/10 bg-slate-100 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                                    {enrollment.course?.thumbnail ? (
                                        <Image
                                            src={enrollment.course.thumbnail}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            alt={enrollment.course.title}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
                                            <span className="text-4xl font-bold text-slate-200 italic">LM S</span>
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="absolute top-5 left-5 z-20 flex gap-2">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-widest shadow-lg ${enrollment.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'
                                            }`}>
                                            {enrollment.status}
                                        </span>
                                        {enrollment.course?.medium && (
                                            <span className="px-4 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-widest shadow-lg bg-blue-500 text-white">
                                                {enrollment.course.medium}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-1">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest mb-2 opacity-80">
                                            {enrollment.course?.category?.name || 'Academic Course'}
                                        </p>
                                        <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
                                            {enrollment.course?.title}
                                        </h3>

                                        {/* Progress Bar */}
                                        <div className="mt-6 mb-8">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Course Progress</span>
                                                <span className="text-[10px] font-semibold text-slate-900">{enrollment.progressPercentage}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                                                    style={{ width: `${enrollment.progressPercentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {enrollment.course?.lessons && enrollment.course.lessons.length > 0 ? (
                                        <Link
                                            href={`/courses/${enrollment.courseId}/lessons/${enrollment.course.lessons.sort((a, b) => a.sortOrder - b.sortOrder)[0].id}`}
                                            className="w-full py-4 bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl text-[10px] font-semibold uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all text-center"
                                        >
                                            Continue Learning
                                        </Link>
                                    ) : (
                                        <div className="w-full py-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl text-[10px] font-semibold uppercase tracking-widest text-center">
                                            Content Coming Soon
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </AppLayout>
        </ProtectedRoute>
    );
}
