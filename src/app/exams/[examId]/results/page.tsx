'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gradingApi, StudentResult } from '@/lib/api/grading';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import {
    CheckCircle2, XCircle, Clock, Award, Download,
    ChevronDown, ChevronUp, Loader2, FileText, MessageSquare
} from 'lucide-react';

interface ResultExam {
    id: string;
    title: string;
    totalMarks: number;
    passingMarks?: number;
    showCorrectAnswers: boolean;
    questions: Array<{
        id: string;
        questionText: string;
        questionType: string;
        marks: number;
        orderIndex: number;
        correctAnswer?: string;
        explanation?: string;
        options?: Array<{
            id: string;
            optionText: string;
            isCorrect?: boolean;
        }>;
    }>;
}

export default function ExamResultsPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.examId as string;

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<ResultExam | null>(null);
    const [results, setResults] = useState<StudentResult[]>([]);
    const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const data = await gradingApi.getMyResult(examId);
                setExam(data.exam);
                setResults(data.results);
                if (data.results.length > 0) {
                    setExpandedAttempt(data.results[0].id);
                }
            } catch (err) {
                const error = err as { response?: { status: number } };
                console.error(err);
                if (error?.response?.status === 404) {
                    alert('No results found for this exam.');
                } else {
                    alert('Failed to load results.');
                }
                router.push('/student/my-courses');
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [examId, router]);

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['student']}>
                <AppLayout>
                    <div className="flex h-[60vh] justify-center items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                </AppLayout>
            </ProtectedRoute>
        );
    }

    if (!exam) return null;

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <AppLayout>
                <div className="p-8 max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{exam.title}</h1>
                        <p className="text-gray-500">
                            Total Marks: {exam.totalMarks}
                            {exam.passingMarks ? ` • Passing: ${exam.passingMarks}` : ''}
                        </p>
                    </div>

                    {/* Results */}
                    <div className="space-y-4">
                        {results.map((result) => {
                            const isExpanded = expandedAttempt === result.id;
                            const isPassed = exam.passingMarks && result.totalMarksAwarded
                                ? Number(result.totalMarksAwarded) >= Number(exam.passingMarks)
                                : null;
                            const percentage = exam.totalMarks > 0
                                ? ((Number(result.totalMarksAwarded || 0) / Number(exam.totalMarks)) * 100).toFixed(1)
                                : '0';

                            return (
                                <div key={result.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Summary */}
                                    <button
                                        onClick={() => setExpandedAttempt(isExpanded ? null : result.id)}
                                        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${result.status === 'graded'
                                                    ? (isPassed ? 'bg-green-50 text-green-600' : isPassed === false ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600')
                                                    : 'bg-orange-50 text-orange-600'
                                                }`}>
                                                {result.status === 'graded' ? (
                                                    isPassed ? <CheckCircle2 className="w-6 h-6" /> : <Award className="w-6 h-6" />
                                                ) : (
                                                    <Clock className="w-6 h-6" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-lg">Attempt {result.attemptNumber}</div>
                                                <div className="text-sm text-gray-500">
                                                    Submitted: {new Date(result.submittedAt).toLocaleString()}
                                                    {result.gradedAt && ` • Graded: ${new Date(result.gradedAt).toLocaleString()}`}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className={`text-2xl font-bold ${result.status === 'graded'
                                                        ? (isPassed === false ? 'text-red-600' : 'text-green-600')
                                                        : 'text-orange-600'
                                                    }`}>
                                                    {result.status === 'graded'
                                                        ? `${result.totalMarksAwarded} / ${exam.totalMarks}`
                                                        : 'Pending'
                                                    }
                                                </div>
                                                {result.status === 'graded' && (
                                                    <div className="text-sm text-gray-500">{percentage}%</div>
                                                )}
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPassed ? 'bg-green-50 text-green-700' : isPassed === false ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {result.status === 'graded' ? (isPassed ? 'PASSED' : isPassed === false ? 'FAILED' : 'GRADED') : result.status.toUpperCase()}
                                                </span>
                                            </div>
                                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                        </div>
                                    </button>

                                    {/* Expanded Detail */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 p-6 bg-gray-50/50">
                                            {/* Overall Feedback */}
                                            {result.feedback && (
                                                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                                    <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-2">
                                                        <MessageSquare className="w-4 h-4" /> Instructor Feedback
                                                    </div>
                                                    <p className="text-gray-700 text-sm">{result.feedback}</p>
                                                </div>
                                            )}

                                            {/* Per-question breakdowns */}
                                            <div className="space-y-4">
                                                {exam.questions.map((q, qIdx) => {
                                                    const answer = result.answers.find(a => a.questionId === q.id);

                                                    return (
                                                        <div key={q.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                                        Q{qIdx + 1} — {q.questionType.replace('_', ' ').toUpperCase()}
                                                                    </span>
                                                                    <h4 className="font-medium text-gray-900 mt-2">{q.questionText}</h4>
                                                                </div>
                                                                {answer && answer.marksAwarded !== undefined && (
                                                                    <span className={`text-sm font-bold px-3 py-1 rounded-lg ${Number(answer.marksAwarded) >= Number(q.marks) * 0.5
                                                                            ? 'bg-green-50 text-green-700'
                                                                            : 'bg-red-50 text-red-700'
                                                                        }`}>
                                                                        {answer.marksAwarded} / {q.marks}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Your answer */}
                                                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                                <div className="text-xs font-bold text-gray-500 uppercase mb-1">Your Answer</div>
                                                                <p className="text-sm text-gray-800">
                                                                    {answer?.answerText || (answer?.uploadUrl ? '[Handwritten Upload]' : 'No answer provided')}
                                                                </p>
                                                                {answer?.uploadUrl && (
                                                                    <a href={answer.uploadUrl} target="_blank" rel="noreferrer"
                                                                        className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                                                                        View Upload →
                                                                    </a>
                                                                )}
                                                            </div>

                                                            {/* Correct answer (when show is enabled) */}
                                                            {exam.showCorrectAnswers && q.options && q.options.length > 0 && (
                                                                <div className="mt-3">
                                                                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Options</div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {q.options.map(opt => (
                                                                            <div key={opt.id} className={`p-2 rounded-lg text-sm border ${opt.isCorrect
                                                                                    ? 'bg-green-50 border-green-200 text-green-800 font-medium'
                                                                                    : 'bg-white border-gray-200 text-gray-600'
                                                                                }`}>
                                                                                {opt.optionText}
                                                                                {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 inline ml-1 text-green-500" />}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {exam.showCorrectAnswers && q.explanation && (
                                                                <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                                                                    <div className="text-xs font-bold text-purple-600 mb-1">Explanation</div>
                                                                    <p className="text-sm text-gray-700">{q.explanation}</p>
                                                                </div>
                                                            )}

                                                            {/* Per-question feedback */}
                                                            {answer?.feedback && (
                                                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                                                                    <div className="text-xs font-bold text-yellow-700 mb-1">Feedback</div>
                                                                    <p className="text-sm text-gray-700">{answer.feedback}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Download PDF */}
                                            <div className="mt-6 flex gap-3 pt-4 border-t border-gray-200">
                                                <a
                                                    href={gradingApi.getPDFUrl(result.id)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                                                >
                                                    <Download className="w-4 h-4" /> Download PDF
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
