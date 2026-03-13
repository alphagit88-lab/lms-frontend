'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gradingApi, GradingSubmission, GradingExamInfo, GradingAnswer } from '@/lib/api/grading';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import {
    CheckCircle2, Clock, User, FileText, Send, Download,
    ChevronDown, ChevronUp, Loader2, AlertTriangle, Eye, Scan, MessageSquare
} from 'lucide-react';

export default function GradeExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.examId as string;

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<GradingExamInfo | null>(null);
    const [submissions, setSubmissions] = useState<GradingSubmission[]>([]);
    const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

    // Grading state: { answerId: { marks: number, feedback: string } }
    const [grades, setGrades] = useState<Record<string, { marks: number; feedback: string }>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [ocrLoadingId, setOcrLoadingId] = useState<string | null>(null);
    const [ocrResults, setOcrResults] = useState<Record<string, string>>({}); // answerId -> ocrText
    const [finalizingId, setFinalizingId] = useState<string | null>(null);
    const [publishing, setPublishing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await gradingApi.getSubmissions(examId);
            setExam(data.exam);
            setSubmissions(data.submissions);

            // Initialize grades from existing data
            const initialGrades: Record<string, { marks: number; feedback: string }> = {};
            data.submissions.forEach(sub => {
                sub.answers.forEach(a => {
                    initialGrades[a.id] = {
                        marks: a.marksAwarded ?? 0,
                        feedback: a.feedback ?? ''
                    };
                });
            });
            setGrades(initialGrades);
        } catch (err) {
            console.error('Failed to fetch grading data:', err);
            alert('Failed to load submissions.');
        } finally {
            setLoading(false);
        }
    }, [examId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleGradeAnswer = async (answerId: string) => {
        const grade = grades[answerId];
        if (!grade) return;

        try {
            setSavingId(answerId);
            await gradingApi.gradeAnswer(answerId, grade.marks, grade.feedback);
        } catch (err) {
            alert('Failed to save grade.');
        } finally {
            setSavingId(null);
        }
    };

    const handleFinalize = async (submissionId: string, overallFeedback?: string) => {
        try {
            setFinalizingId(submissionId);
            await gradingApi.finalizeGrading(submissionId, overallFeedback);
            await fetchData(); // Reload
        } catch (err) {
            alert('Failed to finalize grading.');
        } finally {
            setFinalizingId(null);
        }
    };

    const handlePublishScores = async () => {
        if (!window.confirm('Publish all scores? Students will be able to see their results.')) return;
        try {
            setPublishing(true);
            await gradingApi.publishScores(examId);
            alert('Scores published successfully!');
            await fetchData();
        } catch (err) {
            alert('Failed to publish scores.');
        } finally {
            setPublishing(false);
        }
    };

    const handleTriggerOCR = async (answerId: string, currentOcrText?: string) => {
        // If OCR text already exists, allow re-running by clearing it first
        try {
            setOcrLoadingId(answerId);
            const result = await gradingApi.triggerOCR(answerId);
            if (result?.ocrText) {
                // Store OCR result inline (displayed in the card) instead of a blocking alert
                setOcrResults(prev => ({ ...prev, [answerId]: result.ocrText }));
                // Also refresh so the persisted ocrText is loaded from backend
                await fetchData();
            } else {
                setOcrResults(prev => ({ ...prev, [answerId]: '(No text detected — try a clearer image)' }));
            }
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.message || 'OCR processing failed.';
            setOcrResults(prev => ({ ...prev, [answerId]: `Error: ${msg}` }));
        } finally {
            setOcrLoadingId(null);
        }
    };

    const getQuestionById = (qId: string) => exam?.questions.find(q => q.id === qId);
    const totalSubmissions = submissions.length;
    const gradedCount = submissions.filter(s => s.status === 'graded').length;

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
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
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <AppLayout>
                <div className="p-8 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Grade: {exam.title}</h1>
                                <p className="text-gray-500 mt-1">
                                    Total Marks: {exam.totalMarks}
                                    {exam.passingMarks ? ` • Passing: ${exam.passingMarks}` : ''}
                                    {' '}• {totalSubmissions} submission{totalSubmissions !== 1 ? 's' : ''}
                                    {' '}• {gradedCount} graded
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handlePublishScores}
                                    disabled={publishing}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Publish All Scores
                                </button>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-4">
                            <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                                <span>Grading Progress</span>
                                <span>{gradedCount}/{totalSubmissions}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div
                                    className="bg-green-500 h-2.5 rounded-full transition-all"
                                    style={{ width: `${totalSubmissions > 0 ? (gradedCount / totalSubmissions * 100) : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submissions List */}
                    {submissions.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-700">No submissions yet</h3>
                            <p className="text-gray-400 mt-1">Students haven't submitted answers for this exam.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {submissions.map((sub) => {
                                const isExpanded = expandedSubmission === sub.id;
                                const isPassed = exam.passingMarks && sub.marksAwarded
                                    ? Number(sub.marksAwarded) >= Number(exam.passingMarks)
                                    : null;

                                return (
                                    <div key={sub.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                        {/* Summary Row */}
                                        <button
                                            onClick={() => setExpandedSubmission(isExpanded ? null : sub.id)}
                                            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{sub.studentName}</div>
                                                    <div className="text-xs text-gray-500">
                                                        Attempt {sub.attemptNumber} • {new Date(sub.submittedAt).toLocaleString()}
                                                        {sub.timeSpentMinutes ? ` • ${sub.timeSpentMinutes} min` : ''}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className={`text-sm font-bold ${sub.status === 'graded'
                                                        ? (isPassed === false ? 'text-red-600' : 'text-green-600')
                                                        : 'text-orange-600'}`}>
                                                        {sub.status === 'graded'
                                                            ? `${sub.marksAwarded} / ${exam.totalMarks}`
                                                            : 'Pending'}
                                                    </div>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.status === 'graded'
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-orange-50 text-orange-700'}`}>
                                                        {sub.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                            </div>
                                        </button>

                                        {/* Expanded grading section */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 p-6 bg-gray-50/50">
                                                <div className="space-y-6">
                                                    {exam.questions.map((q, qIdx) => {
                                                        const answer = sub.answers.find(a => a.questionId === q.id);
                                                        if (!answer) return null;
                                                        const gradeState = grades[answer.id] || { marks: 0, feedback: '' };

                                                        return (
                                                            <div key={q.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div>
                                                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                                            Q{qIdx + 1} — {q.questionType.replace('_', ' ').toUpperCase()}
                                                                        </span>
                                                                        <h4 className="font-medium text-gray-900 mt-2">{q.questionText}</h4>
                                                                    </div>
                                                                    <span className="text-sm font-bold text-gray-400">{q.marks} pts</span>
                                                                </div>

                                                                {/* Student's Answer */}
                                                                <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Student's Answer</div>
                                                                    {(() => {
                                                                        const isMCQ = q.questionType === 'multiple_choice' || q.questionType === 'true_false';

                                                                        if (isMCQ && answer.answerText) {
                                                                            // answerText holds an option UUID — resolve to the option label
                                                                            const selectedOpt = q.options?.find(o => o.id === answer.answerText);
                                                                            const isCorrect = selectedOpt?.isCorrect === true;
                                                                            return (
                                                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${
                                                                                    isCorrect
                                                                                        ? 'bg-green-50 border-green-200 text-green-800'
                                                                                        : 'bg-red-50 border-red-200 text-red-700'
                                                                                }`}>
                                                                                    <span>{isCorrect ? '✓' : '✗'}</span>
                                                                                    <span>{selectedOpt?.optionText ?? answer.answerText}</span>
                                                                                </div>
                                                                            );
                                                                        }

                                                                        if (answer.answerText) {
                                                                            return <p className="text-gray-800 whitespace-pre-wrap text-sm">{answer.answerText}</p>;
                                                                        }

                                                                        return <p className="text-gray-400 italic text-sm">No text answer provided</p>;
                                                                    })()}

                                                                    {answer.uploadUrl && (
                                                                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                                                                            <a
                                                                                href={`http://localhost:5000${answer.uploadUrl}`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"
                                                                            >
                                                                                <Eye className="w-4 h-4" /> View Uploaded Image
                                                                            </a>
                                                                            <button
                                                                                onClick={() => handleTriggerOCR(answer.id, answer.ocrText)}
                                                                                disabled={ocrLoadingId === answer.id}
                                                                                className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                                                                            >
                                                                                {ocrLoadingId === answer.id ? (
                                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                                ) : (
                                                                                    <Scan className="w-4 h-4" />
                                                                                )}
                                                                                {ocrLoadingId === answer.id ? 'Running OCR...' : 'Run OCR'}
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                    {/* Show OCR text: from live result OR persisted in DB */}
                                                                    {(ocrResults[answer.id] || answer.ocrText) && (
                                                                        <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                                                                            <div className="text-xs font-bold text-purple-600 mb-1 flex items-center gap-1.5">
                                                                                <Scan className="w-3.5 h-3.5" /> OCR Extracted Text
                                                                            </div>
                                                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                                                {ocrResults[answer.id] || answer.ocrText}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Correct Answer (for MCQ) */}
                                                                {q.options && q.options.length > 0 && (
                                                                    <div className="mt-3">
                                                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Options</div>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {q.options.map(opt => (
                                                                                <div
                                                                                    key={opt.id}
                                                                                    className={`p-2 rounded-lg text-sm border ${opt.isCorrect
                                                                                        ? 'bg-green-50 border-green-200 text-green-800 font-medium'
                                                                                        : answer.answerText === opt.id
                                                                                            ? 'bg-red-50 border-red-200 text-red-700'
                                                                                            : 'bg-white border-gray-200 text-gray-600'}`}
                                                                                >
                                                                                    {opt.optionText}
                                                                                    {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 inline ml-1 text-green-500" />}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Grading inputs */}
                                                                <div className="mt-4 flex flex-col md:flex-row gap-4 items-end">
                                                                    <div className="flex-shrink-0 w-32">
                                                                        <label className="block text-xs font-bold text-gray-500 mb-1">Marks</label>
                                                                        <input
                                                                            type="number"
                                                                            min={0}
                                                                            max={q.marks}
                                                                            step={0.5}
                                                                            value={gradeState.marks}
                                                                            onChange={e => setGrades(prev => ({
                                                                                ...prev,
                                                                                [answer.id]: { ...prev[answer.id], marks: parseFloat(e.target.value) || 0 }
                                                                            }))}
                                                                            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <label className="block text-xs font-bold text-gray-500 mb-1">Feedback</label>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="e.g. Good explanation but missing key point..."
                                                                            value={gradeState.feedback}
                                                                            onChange={e => setGrades(prev => ({
                                                                                ...prev,
                                                                                [answer.id]: { ...prev[answer.id], feedback: e.target.value }
                                                                            }))}
                                                                            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleGradeAnswer(answer.id)}
                                                                        disabled={savingId === answer.id}
                                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                                                                    >
                                                                        {savingId === answer.id ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle2 className="w-4 h-4" />
                                                                        )}
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Finalize Section */}
                                                <div className="mt-6 flex flex-col md:flex-row items-center gap-4 pt-6 border-t border-gray-200">
                                                    <button
                                                        onClick={() => {
                                                            const fb = prompt("Optional overall feedback for this student (leave empty if none):");
                                                            handleFinalize(sub.id, fb || undefined);
                                                        }}
                                                        disabled={finalizingId === sub.id}
                                                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 shadow-sm"
                                                    >
                                                        {finalizingId === sub.id ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        )}
                                                        Finalize & Calculate Total
                                                    </button>
                                                    <a
                                                        href={gradingApi.getPDFUrl(sub.id)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download PDF
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
