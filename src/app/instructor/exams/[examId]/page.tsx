'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { examApi, ExamStats } from '@/lib/api/exams';
import {
    Users, CheckCircle2, Clock, Award, TrendingUp,
    AlertTriangle, ArrowLeft, ExternalLink, Loader2, FileText, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

// ─── helpers ────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
    const map: Record<string, { label: string; class: string }> = {
        graded:    { label: 'Graded',        class: 'bg-green-50 text-green-700' },
        submitted: { label: 'Submitted',     class: 'bg-yellow-50 text-yellow-700' },
        draft:     { label: 'In Progress',   class: 'bg-gray-100 text-gray-600' },
    };
    const m = map[status] ?? { label: status, class: 'bg-gray-100 text-gray-500' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${m.class}`}>
            {m.label}
        </span>
    );
}

// ─── component ──────────────────────────────────────────────────────────────

export default function InstructorExamDetailPage() {
    const { examId } = useParams<{ examId: string }>();
    const [exam, setExam] = useState<Awaited<ReturnType<typeof examApi.getExamById>> | null>(null);
    const [stats, setStats] = useState<ExamStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview');

    useEffect(() => {
        if (!examId) return;
        Promise.all([
            examApi.getExamById(examId),
            examApi.getExamStats(examId),
        ])
            .then(([e, s]) => { setExam(e); setStats(s); })
            .catch(err => { console.error(err); setError('Failed to load exam data.'); })
            .finally(() => setLoading(false));
    }, [examId]);

    return (
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <AppLayout>
                <div className="p-6 max-w-7xl mx-auto">

                    {/* Back link */}
                    <Link
                        href="/instructor/exams"
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Exams
                    </Link>

                    {/* Loading / Error */}
                    {loading && (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}

                    {!loading && !error && exam && stats && (
                        <>
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 uppercase tracking-wide">
                                            {exam.examType?.replace('_', ' ')}
                                        </span>
                                        {exam.isPublished ? (
                                            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                                                <CheckCircle2 className="w-3 h-3" /> Published
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                                                Draft
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
                                    {exam.description && (
                                        <p className="text-gray-500 mt-1 text-sm max-w-xl">{exam.description}</p>
                                    )}
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <Link
                                        href={`/instructor/exams/${examId}/grade`}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Grade Submissions <ExternalLink className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>

                            {/* Pending alert */}
                            {stats.pendingGradingCount > 0 && (
                                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800">
                                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                                    <p className="text-sm font-medium">
                                        <strong>{stats.pendingGradingCount}</strong> submission{stats.pendingGradingCount > 1 ? 's' : ''} awaiting grading.{' '}
                                        <Link href={`/instructor/exams/${examId}/grade`} className="underline hover:text-amber-900">
                                            Grade now →
                                        </Link>
                                    </p>
                                </div>
                            )}

                            {/* Stats cards */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                                {[
                                    {
                                        label: 'Total Submissions',
                                        value: stats.totalSubmissions,
                                        icon: <Users className="w-5 h-5" />,
                                        color: 'text-gray-700', bg: 'bg-gray-50',
                                    },
                                    {
                                        label: 'Graded',
                                        value: stats.gradedCount,
                                        icon: <CheckCircle2 className="w-5 h-5" />,
                                        color: 'text-green-700', bg: 'bg-green-50',
                                    },
                                    {
                                        label: 'Pending',
                                        value: stats.pendingGradingCount,
                                        icon: <Clock className="w-5 h-5" />,
                                        color: 'text-yellow-700', bg: 'bg-yellow-50',
                                    },
                                    {
                                        label: 'Avg Score',
                                        value: stats.averageScore !== null ? `${stats.averageScore}%` : '—',
                                        icon: <Award className="w-5 h-5" />,
                                        color: 'text-blue-700', bg: 'bg-blue-50',
                                    },
                                    {
                                        label: 'Pass Rate',
                                        value: stats.passRate !== null ? `${stats.passRate}%` : '—',
                                        icon: <TrendingUp className="w-5 h-5" />,
                                        color: 'text-purple-700', bg: 'bg-purple-50',
                                    },
                                ].map(c => (
                                    <div key={c.label} className={`${c.bg} rounded-xl p-4 flex items-center gap-3`}>
                                        <div className={c.color}>{c.icon}</div>
                                        <div>
                                            <p className="text-xl font-bold text-gray-900">{c.value}</p>
                                            <p className="text-xs text-gray-500">{c.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pass/Fail bar */}
                            {stats.gradedCount > 0 && (
                                <div className="mb-8 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Pass / Fail Breakdown</h2>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                                            <div
                                                className="h-4 bg-green-500 rounded-full transition-all"
                                                style={{ width: `${stats.passRate ?? 0}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 w-12 text-right">{stats.passRate ?? 0}%</span>
                                    </div>
                                    <div className="flex gap-6 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                                            Passed: {stats.passCount}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-300 inline-block" />
                                            Failed: {stats.failCount}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="flex gap-2 border-b border-gray-200 mb-6">
                                {(['overview', 'students'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setActiveTab(t)}
                                        className={`pb-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
                                            activeTab === t
                                                ? 'border-blue-600 text-blue-700'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {/* Overview tab */}
                            {activeTab === 'overview' && (
                                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                    <h2 className="text-base font-semibold text-gray-800 mb-4">Exam Details</h2>
                                    <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                                        {[
                                            { label: 'Exam Type', value: exam.examType?.replace('_', ' ') },
                                            { label: 'Total Marks', value: exam.totalMarks },
                                            { label: 'Passing Marks', value: exam.passingMarks ?? '—' },
                                            { label: 'Duration', value: exam.durationMinutes ? `${exam.durationMinutes} minutes` : '—' },
                                            { label: 'Max Attempts', value: exam.maxAttempts },
                                            { label: 'Show Answers', value: exam.showCorrectAnswers ? 'Yes' : 'No' },
                                            { label: 'Language', value: exam.language ?? '—' },
                                            {
                                                label: 'Exam Date',
                                                value: exam.examDate ? format(new Date(exam.examDate), 'PPP') : '—',
                                            },
                                        ].map(item => (
                                            <div key={item.label}>
                                                <dt className="text-gray-400 font-medium">{item.label}</dt>
                                                <dd className="text-gray-900 font-semibold capitalize mt-0.5">{String(item.value)}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            )}

                            {/* Students tab */}
                            {activeTab === 'students' && (
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    {stats.recentStudents.length === 0 ? (
                                        <div className="text-center py-20">
                                            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FileText className="w-7 h-7 text-gray-300" />
                                            </div>
                                            <p className="text-gray-400 text-sm">No submissions yet.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                                                    <tr>
                                                        <th className="px-5 py-3">Student</th>
                                                        <th className="px-5 py-3">Status</th>
                                                        <th className="px-5 py-3">Score</th>
                                                        <th className="px-5 py-3">Attempt</th>
                                                        <th className="px-5 py-3">Submitted</th>
                                                        <th className="px-5 py-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {stats.recentStudents.map((s, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-5 py-4 font-medium text-gray-900">{s.studentName}</td>
                                                            <td className="px-5 py-4">{statusBadge(s.status)}</td>
                                                            <td className="px-5 py-4 text-gray-700">
                                                                {s.marksAwarded !== null
                                                                    ? `${s.marksAwarded} / ${exam.totalMarks}`
                                                                    : <span className="text-gray-400">—</span>
                                                                }
                                                            </td>
                                                            <td className="px-5 py-4 text-gray-500">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <RefreshCw className="w-3 h-3" /> {s.attemptNumber}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 text-gray-500">
                                                                {s.submittedAt
                                                                    ? format(new Date(s.submittedAt), 'MMM d, yyyy HH:mm')
                                                                    : '—'}
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                <Link
                                                                    href={`/instructor/exams/${examId}/grade`}
                                                                    className="inline-flex items-center gap-1 text-blue-600 text-xs font-medium hover:text-blue-800"
                                                                >
                                                                    Grade <ExternalLink className="w-3 h-3" />
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {stats.totalSubmissions > stats.recentStudents.length && (
                                                <div className="px-5 py-3 text-xs text-gray-400 border-t border-gray-50">
                                                    Showing {stats.recentStudents.length} of {stats.totalSubmissions} submissions.
                                                    Use the grading page to see all.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
