'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { examApi, StudentAvailableExam } from '@/lib/api/exams';
import {
    FileText, Clock, Calendar, CheckCircle2, AlertCircle,
    RefreshCw, Award, BookOpen, Loader2, ArrowRight, BarChart2
} from 'lucide-react';
import { format } from 'date-fns';

// ─── helpers ────────────────────────────────────────────────────────────────

function statusBadge(exam: StudentAvailableExam) {
    const s = exam.submission;
    if (!s) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                <FileText className="w-3 h-3" /> Not Started
            </span>
        );
    }
    if (s.latestStatus === 'graded') {
        const pct = exam.totalMarks > 0 ? Math.round((s.latestMarks! / exam.totalMarks) * 100) : 0;
        const passed = exam.passingMarks ? s.latestMarks! >= exam.passingMarks : true;
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {passed ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {passed ? 'Passed' : 'Failed'} · {pct}%
            </span>
        );
    }
    if (s.latestStatus === 'submitted') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700">
                <Clock className="w-3 h-3" /> Submitted — Pending Grade
            </span>
        );
    }
    if (s.latestStatus === 'draft') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                <RefreshCw className="w-3 h-3" /> Draft In Progress
            </span>
        );
    }
    return null;
}

function examTypeLabel(type: string) {
    return type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function actionButton(exam: StudentAvailableExam) {
    const s = exam.submission;
    const attemptsLeft = exam.maxAttempts - (s?.attemptCount ?? 0);

    if (!s || s.latestStatus === 'draft') {
        return (
            <Link
                href={`/exams/${exam.id}/take`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
                {s?.latestStatus === 'draft' ? 'Continue' : 'Start Exam'}
                <ArrowRight className="w-4 h-4" />
            </Link>
        );
    }

    const canRetry = attemptsLeft > 0;

    return (
        <div className="flex items-center gap-2">
            {s.latestStatus === 'graded' && (
                <Link
                    href={`/exams/${exam.id}/results`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                >
                    <BarChart2 className="w-3.5 h-3.5" /> View Results
                </Link>
            )}
            {canRetry && (
                <Link
                    href={`/exams/${exam.id}/take`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry ({attemptsLeft} left)
                </Link>
            )}
        </div>
    );
}

// ─── component ──────────────────────────────────────────────────────────────

export default function StudentExamsPage() {
    const [exams, setExams] = useState<StudentAvailableExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'not_started' | 'in_progress' | 'graded'>('all');

    useEffect(() => {
        examApi.getStudentAvailableExams()
            .then(setExams)
            .catch(err => {
                console.error(err);
                setError('Could not load exams. Please try again.');
            })
            .finally(() => setLoading(false));
    }, []);

    const filtered = exams.filter(e => {
        if (filter === 'not_started') return !e.submission;
        if (filter === 'in_progress') return e.submission?.latestStatus === 'submitted';
        if (filter === 'graded') return e.submission?.latestStatus === 'graded';
        return true;
    });

    const stats = {
        total: exams.length,
        notStarted: exams.filter(e => !e.submission).length,
        submitted: exams.filter(e => e.submission?.latestStatus === 'submitted').length,
        graded: exams.filter(e => e.submission?.latestStatus === 'graded').length,
    };

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <AppLayout>
                <div className="p-6 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">My Exams</h1>
                        <p className="text-gray-500 mt-1">Assessments from your enrolled courses.</p>
                    </div>

                    {/* Stats cards */}
                    {!loading && !error && exams.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: 'Total', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50', icon: <BookOpen className="w-5 h-5" /> },
                                { label: 'Not Started', value: stats.notStarted, color: 'text-blue-700', bg: 'bg-blue-50', icon: <FileText className="w-5 h-5" /> },
                                { label: 'Pending Grade', value: stats.submitted, color: 'text-yellow-700', bg: 'bg-yellow-50', icon: <Clock className="w-5 h-5" /> },
                                { label: 'Graded', value: stats.graded, color: 'text-green-700', bg: 'bg-green-50', icon: <Award className="w-5 h-5" /> },
                            ].map(s => (
                                <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
                                    <div className={`${s.color}`}>{s.icon}</div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                        <p className="text-xs text-gray-500">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Filter tabs */}
                    {!loading && !error && exams.length > 0 && (
                        <div className="flex gap-2 mb-6 border-b border-gray-200">
                            {(['all', 'not_started', 'in_progress', 'graded'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`pb-3 px-3 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
                                        filter === f
                                            ? 'border-blue-600 text-blue-700'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {f.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Content */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {filter === 'all' ? 'No exams available' : `No ${filter.replace('_', ' ')} exams`}
                            </h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                {filter === 'all'
                                    ? 'Once your instructors publish exams for your enrolled courses, they will appear here.'
                                    : 'Try the "All" tab to see all your exams.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {filtered.map(exam => (
                                <div key={exam.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-100 hover:shadow-md transition-all p-5 flex flex-col">
                                    {/* Type badge + status */}
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 uppercase tracking-wide">
                                            {examTypeLabel(exam.examType)}
                                        </span>
                                        {statusBadge(exam)}
                                    </div>

                                    {/* Title + course */}
                                    <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">{exam.title}</h3>
                                    <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                        {exam.course?.title ?? 'Unknown Course'}
                                    </p>

                                    {/* Metadata row */}
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-4">
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            {exam.questionCount} Questions
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Award className="w-3 h-3" />
                                            {exam.totalMarks} Marks
                                        </span>
                                        {exam.durationMinutes && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {exam.durationMinutes} Min
                                            </span>
                                        )}
                                        {exam.examDate && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(exam.examDate), 'MMM d, yyyy')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Score display (if graded) */}
                                    {exam.submission?.latestStatus === 'graded' && exam.submission.latestMarks !== null && (
                                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-500">Your Score</span>
                                                <span className="font-bold text-gray-900">
                                                    {exam.submission.latestMarks} / {exam.totalMarks}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${
                                                        exam.passingMarks && exam.submission.latestMarks >= exam.passingMarks
                                                            ? 'bg-green-500' : 'bg-red-400'
                                                    }`}
                                                    style={{ width: `${Math.min(100, Math.round((exam.submission.latestMarks / exam.totalMarks) * 100))}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Attempt count */}
                                    {exam.submission && (
                                        <p className="text-xs text-gray-400 mb-3">
                                            Attempt {exam.submission.attemptCount} of {exam.maxAttempts}
                                        </p>
                                    )}

                                    {/* CTA */}
                                    <div className="mt-auto pt-4 border-t border-gray-50">
                                        {actionButton(exam)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
