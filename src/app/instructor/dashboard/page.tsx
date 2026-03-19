'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { examApi, Exam } from '@/lib/api/exams';
import { getMyTeacherProfile, TeacherProfile } from '@/lib/api/profile';
import {
    BookOpen, FileText, Calendar, Clock, DollarSign,
    Video, Settings, ChevronRight, Loader2,
    ClipboardCheck, BarChart3, Layers,
    Plus, Upload,
    PenTool, Image as ImageIcon, FolderOpen, Sparkles
} from 'lucide-react';

export default function InstructorDashboardPage() {
    const [greeting, setGreeting] = useState('');
    const [recentExams, setRecentExams] = useState<Exam[]>([]);
    const [loadingExams, setLoadingExams] = useState(true);
    const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null | undefined>(undefined);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 17) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');

        // Load recent exams
        const loadExams = async () => {
            try {
                const exams = await examApi.getMyExams();
                setRecentExams(exams.slice(0, 4));
            } catch (err) {
                console.warn('Could not load exams:', err);
            } finally {
                setLoadingExams(false);
            }
        };

        // Check if teacher profile is complete
        const loadProfile = async () => {
            try {
                const profile = await getMyTeacherProfile();
                setTeacherProfile(profile);
            } catch {
                setTeacherProfile(null);
            }
        };

        loadExams();
        loadProfile();
    }, []);

    // Profile is incomplete if no specialization AND no hourly rate set yet
    const profileIncomplete =
        teacherProfile !== undefined &&
        (!teacherProfile?.specialization && !teacherProfile?.hourlyRate);

    return (
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <AppLayout>
                <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">

                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{greeting}, Instructor 👋</h1>
                        <p className="text-gray-500 mt-1">Manage your exams, content, and teaching tools.</p>
                    </div>

                    {/* ── Profile Setup Banner ── */}
                    {profileIncomplete && (
                        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-blue-900">Complete your teacher profile</p>
                                <p className="text-xs text-blue-600 mt-0.5">
                                    Add your bio, subjects, and hourly rate so students can find and book you.
                                </p>
                            </div>
                            <Link
                                href="/instructor/onboarding"
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                            >
                                Set Up Profile
                            </Link>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* EXAMS & ASSESSMENTS SECTION                    */}
                    {/* ═══════════════════════════════════════════════ */}
                    <section>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                    <ClipboardCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Exams & Assessments</h2>
                                    <p className="text-xs text-gray-400">Create, grade, and publish exams</p>
                                </div>
                            </div>
                            <Link
                                href="/instructor/exams"
                                className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
                            >
                                View All <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Quick Action Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <Link href="/instructor/exams/create" className="group bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-purple-200 transition-all">
                                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">Create Exam</h4>
                                <p className="text-xs text-gray-400 mt-0.5">MCQ, Essay, Upload</p>
                            </Link>

                            <Link href="/instructor/exams" className="group bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">My Exams</h4>
                                <p className="text-xs text-gray-400 mt-0.5">Edit & Publish</p>
                            </Link>

                            <Link href="/instructor/exams" className="group bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-green-200 transition-all">
                                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <PenTool className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">Grade</h4>
                                <p className="text-xs text-gray-400 mt-0.5">Mark & Feedback</p>
                            </Link>

                            <Link href="/instructor/exams" className="group bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-orange-200 transition-all">
                                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">Results</h4>
                                <p className="text-xs text-gray-400 mt-0.5">Scores & Reports</p>
                            </Link>
                        </div>

                        {/* Recent Exams */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-800 text-sm">Recent Exams</h3>
                                <Link href="/instructor/exams/create" className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors">
                                    + New Exam
                                </Link>
                            </div>

                            {loadingExams ? (
                                <div className="p-8 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-300" />
                                </div>
                            ) : recentExams.length === 0 ? (
                                <div className="p-8 text-center">
                                    <ClipboardCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-sm text-gray-400">No exams created yet.</p>
                                    <Link href="/instructor/exams/create" className="text-sm text-purple-600 font-bold hover:underline mt-2 inline-block">
                                        Create your first exam →
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {recentExams.map(exam => (
                                        <div key={exam.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-2 h-2 rounded-full shrink-0 ${exam.isPublished ? 'bg-green-500' : 'bg-orange-400'}`} />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{exam.title}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {exam.examType.replace('_', ' ')} • {exam.totalMarks} marks
                                                        {exam.durationMinutes ? ` • ${exam.durationMinutes} min` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exam.isPublished
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-orange-50 text-orange-700'
                                                    }`}>
                                                    {exam.isPublished ? 'Published' : 'Draft'}
                                                </span>
                                                {exam.isPublished && (
                                                    <Link
                                                        href={`/instructor/exams/${exam.id}/grade`}
                                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                                    >
                                                        Grade →
                                                    </Link>
                                                )}
                                                <Link
                                                    href={`/instructor/exams/create?edit=${exam.id}`}
                                                    className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    Edit
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ═══════════════════════════════════════════════ */}
                    {/* CONTENT LIBRARY SECTION                        */}
                    {/* ═══════════════════════════════════════════════ */}
                    <section>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Content Library</h2>
                                    <p className="text-xs text-gray-400">Upload and organize course materials</p>
                                </div>
                            </div>
                            <Link
                                href="/instructor/content"
                                className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
                            >
                                View All <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Link href="/instructor/content" className="group bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-orange-200 transition-all">
                                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">Upload Files</h4>
                                <p className="text-xs text-gray-400 mt-0.5">PDFs, Videos, Docs</p>
                            </Link>

                            <Link href="/instructor/content" className="group bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all">
                                <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Video className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">Video Lessons</h4>
                                <p className="text-xs text-gray-400 mt-0.5">Record & Stream</p>
                            </Link>

                            <Link href="/instructor/content" className="group bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">Images</h4>
                                <p className="text-xs text-gray-400 mt-0.5">Slides & Diagrams</p>
                            </Link>

                            <Link href="/instructor/content" className="group bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <FolderOpen className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">All Content</h4>
                                <p className="text-xs text-gray-400 mt-0.5">Browse Library</p>
                            </Link>
                        </div>
                    </section>

                    {/* ═══════════════════════════════════════════════ */}
                    {/* OTHER QUICK LINKS                              */}
                    {/* ═══════════════════════════════════════════════ */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Other Tools</h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {[
                                { href: '/instructor/courses', label: 'My Courses', icon: <BookOpen className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50' },
                                { href: '/instructor/sessions', label: 'Live Sessions', icon: <Video className="w-4 h-4" />, color: 'text-red-600 bg-red-50' },
                                { href: '/instructor/bookings', label: 'Bookings', icon: <Calendar className="w-4 h-4" />, color: 'text-green-600 bg-green-50' },
                                { href: '/instructor/recordings', label: 'Recordings', icon: <FileText className="w-4 h-4" />, color: 'text-cyan-600 bg-cyan-50' },
                                { href: '/instructor/availability', label: 'Availability', icon: <Clock className="w-4 h-4" />, color: 'text-indigo-600 bg-indigo-50' },
                                { href: '/instructor/earnings', label: 'Earnings', icon: <DollarSign className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50' },
                                { href: '/instructor/settings/pricing', label: 'Pricing', icon: <Settings className="w-4 h-4" />, color: 'text-gray-600 bg-gray-50' },
                                { href: '/instructor/courses/create', label: 'New Course', icon: <Plus className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50' },
                                { href: '/dashboard', label: 'Main Dashboard', icon: <BarChart3 className="w-4 h-4" />, color: 'text-slate-600 bg-slate-50' },
                            ].map(item => (
                                <Link
                                    key={item.href + item.label}
                                    href={item.href}
                                    className="group flex items-center gap-2.5 p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color} group-hover:scale-110 transition-transform`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 truncate">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </section>

                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
