'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { submissionApi, AnswerPayload, SubmissionHistory } from '@/lib/api/submissions';
import { Exam } from '@/lib/api/exams';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Clock, ChevronRight, ChevronLeft, AlertTriangle, UploadCloud, X, FileImage } from 'lucide-react';

export default function TakeExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.examId as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Exam Data
    const [exam, setExam] = useState<Exam | null>(null);
    const [history, setHistory] = useState<SubmissionHistory[]>([]);

    // Taking State
    const [started, setStarted] = useState(false);
    const [answers, setAnswers] = useState<Record<string, AnswerPayload>>({});
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [uploading, setUploading] = useState<Record<string, boolean>>({});

    // Timer logic
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch the exam
                const e = await submissionApi.getExamForStudent(examId);
                setExam(e);

                // Fetch history
                const h = await submissionApi.getSubmissionHistory(examId);
                setHistory(h);

            } catch (err) {
                console.error(err);
                const error = err as { response?: { status: number; data: { error: string } } };
                if (error?.response?.status === 403) {
                    alert(error.response.data.error || "Cannot access exam.");
                } else {
                    alert("Failed to load exam.");
                }
                router.push('/student/my-courses');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [examId, router]);

    // Format timer
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleStart = () => {
        if (!exam) return;
        setStarted(true);
        if (exam.durationMinutes && exam.durationMinutes > 0) {
            setTimeLeft(exam.durationMinutes * 60);
        }
    };

    // Auto submit safely
    const handleSubmitRef = React.useRef<() => void>(undefined);

    const handleSubmit = useCallback(async () => {
        if (!exam) return;
        try {
            setSubmitting(true);
            const ansArray = Object.values(answers);

            // Assume time spent based on difference
            const spent = exam.durationMinutes ? Math.floor(exam.durationMinutes - (timeLeft || 0) / 60) : 0;

            await submissionApi.submitExam(examId, {
                answers: ansArray,
                timeSpentMinutes: spent > 0 ? spent : 1
            });

            alert(`Submitted Successfully!`);
            router.push(`/exams/${examId}/results`);
        } catch (err) {
            console.error(err);
            alert("Failed to deliver submission.");
            setSubmitting(false); // only re-enable if it failed
        }
    }, [exam, answers, examId, router, timeLeft]);

    handleSubmitRef.current = handleSubmit;

    // Timer effect
    useEffect(() => {
        if (!started || timeLeft === null) return;
        if (timeLeft <= 0) {
            // Auto-submit
            if (handleSubmitRef.current) handleSubmitRef.current();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(t => (t !== null && t > 0 ? t - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [started, timeLeft]);

    // Auto-save draft every 30 seconds
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    useEffect(() => {
        if (!started || !exam) return;

        const autoSave = setInterval(async () => {
            try {
                const ansArray = Object.values(answers);
                if (ansArray.length > 0) {
                    await submissionApi.saveDraft(examId, ansArray);
                    setLastSaved(new Date().toLocaleTimeString());
                }
            } catch (err) {
                console.warn('Auto-save failed:', err);
            }
        }, 30000); // Every 30 seconds

        return () => clearInterval(autoSave);
    }, [started, exam, answers, examId]);

    const handleAnswerChange = (questionId: string, val: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                questionId,
                answerText: val,
            }
        }));
    };

    const handleUpload = async (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        try {
            setUploading(prev => ({ ...prev, [questionId]: true }));
            const res = await submissionApi.uploadAnswerImage(examId, questionId, file);
            setAnswers(prev => ({
                ...prev,
                [questionId]: {
                    ...prev[questionId],
                    questionId,
                    uploadUrl: res.uploadUrl
                }
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to upload image. Please try again.';
            alert(errorMessage);
        } finally {
            setUploading(prev => ({ ...prev, [questionId]: false }));
            e.target.value = ''; // Reset input
        }
    };

    const handleRemoveUpload = (questionId: string) => {
        if (!window.confirm("Remove uploaded attachment?")) return;
        setAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                uploadUrl: undefined
            }
        }));
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['student']}>
                <AppLayout>
                    <div className="flex h-[60vh] justify-center items-center text-blue-600">Loading Exam...</div>
                </AppLayout>
            </ProtectedRoute>
        );
    }

    if (!exam) return null;

    // View BEFORE starting
    if (!started) {
        const remainingAttempts = exam.maxAttempts ? exam.maxAttempts - history.length : Infinity;
        const reachedMax = remainingAttempts <= 0;

        return (
            <ProtectedRoute allowedRoles={['student']}>
                <AppLayout>
                    <div className="p-8 max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{exam.title}</h1>
                            <p className="text-gray-500 mb-8 max-w-lg mx-auto">{exam.description || 'No description provided.'}</p>

                            <div className="grid grid-cols-3 gap-6 mb-8 mt-10 p-6 bg-blue-50 rounded-xl max-w-2xl mx-auto">
                                <div className="text-center">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase">Duration</h4>
                                    <p className="text-xl font-bold text-blue-900 flex items-center justify-center gap-2 mt-1">
                                        <Clock className="w-5 h-5" /> {exam.durationMinutes ? `${exam.durationMinutes} mins` : 'Untimed'}
                                    </p>
                                </div>
                                <div className="text-center border-l border-blue-200">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase">Total Marks</h4>
                                    <p className="text-xl font-bold text-blue-900 mt-1">{exam.totalMarks}</p>
                                </div>
                                <div className="text-center border-l border-blue-200">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase">Attempts Left</h4>
                                    <p className="text-xl font-bold text-blue-900 mt-1">{remainingAttempts === Infinity ? 'Unlimited' : remainingAttempts}</p>
                                </div>
                            </div>

                            {reachedMax ? (
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg font-medium">
                                    <AlertTriangle className="w-5 h-5" /> You have reached the maximum number of attempts.
                                </div>
                            ) : (
                                <button
                                    onClick={handleStart}
                                    className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all hover:scale-105"
                                >
                                    Start Attempt
                                </button>
                            )}
                        </div>

                        {history.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Past Attempts</h3>
                                <div className="bg-white rounded-xl border border-gray-200 divide-y">
                                    {history.map(h => (
                                        <div key={h.id} className="p-4 flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-gray-900">Attempt {h.attemptNumber}</div>
                                                <div className="text-sm text-gray-500">{new Date(h.submittedAt).toLocaleString()}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 uppercase">
                                                        {h.status}
                                                    </div>
                                                    <div className="font-bold text-blue-600 mt-1">
                                                        {h.status === 'graded' ? `${h.marksAwarded} / ${exam.totalMarks}` : 'Pending Grade'}
                                                    </div>
                                                </div>
                                                {h.status === 'graded' && (
                                                    <a
                                                        href={`/exams/${examId}/results`}
                                                        className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                    >
                                                        View Results
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </AppLayout>
            </ProtectedRoute>
        );
    }

    // View AFTER starting
    const questions = exam.questions || [];
    const currentQ = questions[currentQIndex];

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Header Navbar */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <div>
                        <h1 className="font-bold text-gray-900 text-lg">{exam.title}</h1>
                        <p className="text-sm text-gray-500">
                            Question {currentQIndex + 1} of {questions.length}
                        </p>
                    </div>
                    {timeLeft !== null && (
                        <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
                            <Clock className="w-5 h-5" />
                            {formatTime(timeLeft)}
                        </div>
                    )}
                    {lastSaved && (
                        <span className="text-xs text-gray-400 hidden md:inline">Auto-saved {lastSaved}</span>
                    )}
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to finish and submit?')) {
                                handleSubmit();
                            }
                        }}
                        disabled={submitting}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                </header>

                {/* Main Content */}
                <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-8">
                    {currentQ && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-100">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-xl font-medium text-gray-900 leading-relaxed">
                                    <span className="font-bold mr-2">{currentQIndex + 1}.</span>
                                    {currentQ.questionText}
                                </h2>
                                <span className="shrink-0 ml-4 px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm font-bold">
                                    {currentQ.marks} Pts
                                </span>
                            </div>

                            {/* Answers Area */}
                            <div className="mt-8">
                                {currentQ.questionType === 'multiple_choice' || currentQ.questionType === 'true_false' ? (
                                    <div className="space-y-3">
                                        {currentQ.options?.map((opt) => {
                                            const isSelected = answers[currentQ.id]?.answerText === opt.id;
                                            return (
                                                <label
                                                    key={opt.id}
                                                    className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${isSelected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 shrink-0 transition-colors ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'}`}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                    </div>
                                                    <span className="text-gray-800">{opt.optionText}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : currentQ.questionType === 'essay' ? (
                                    <div className="space-y-4">
                                        <textarea
                                            value={answers[currentQ.id]?.answerText || ''}
                                            onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                                            placeholder="Type your essay answer here..."
                                            className="w-full h-48 border border-gray-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900"
                                        />

                                        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 transition-colors hover:border-blue-400">
                                            {answers[currentQ.id]?.uploadUrl ? (
                                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                                                    <div className="flex items-center gap-3 overflow-hidden text-blue-900">
                                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                                                            <FileImage className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold truncate">Uploaded Attachment</p>
                                                            <a href={answers[currentQ.id].uploadUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">View File</a>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleRemoveUpload(currentQ.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <UploadCloud className="w-6 h-6" />
                                                    </div>
                                                    <h3 className="text-sm font-bold text-gray-900 mb-1">Upload Handwritten Answer</h3>
                                                    <p className="text-xs text-gray-500 mb-4">PNG, JPG or PDF (max 10MB)</p>
                                                    <label className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2 hover:bg-blue-700 bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors shadow-sm ${uploading[currentQ.id] ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        {uploading[currentQ.id] ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            'Choose Image'
                                                        )}
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/png, image/jpeg, application/pdf"
                                                            onChange={(e) => handleUpload(currentQ.id, e)}
                                                            disabled={uploading[currentQ.id]}
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800 border border-yellow-200 flex items-start gap-3">
                                            <AlertTriangle className="shrink-0 w-5 h-5 text-yellow-600 mt-0.5" />
                                            <p>Remember to save your work frequently. You can type &quot;See attached&quot; if you prefer to upload a fully handwritten document.</p>
                                        </div>
                                    </div>
                                ) : currentQ.questionType === 'short_answer' ? (
                                    <textarea
                                        value={answers[currentQ.id]?.answerText || ''}
                                        onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                                        placeholder="Type your short answer here..."
                                        rows={4}
                                        className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 resize-y"
                                    />
                                ) : (
                                    <div className="text-red-500 italic">Unsupported question type.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bottom Nav */}
                    <div className="mt-8 flex justify-between items-center">
                        <button
                            disabled={currentQIndex === 0}
                            onClick={() => setCurrentQIndex(i => Math.max(0, i - 1))}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors font-medium"
                        >
                            <ChevronLeft className="w-5 h-5" /> Previous
                        </button>

                        <div className="flex gap-2">
                            {questions.map((q, i) => {
                                const isAnswered = !!answers[q.id]?.answerText;
                                const isActive = currentQIndex === i;
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQIndex(i)}
                                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all focus:outline-none ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' : isAnswered ? 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200' : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            disabled={currentQIndex === questions.length - 1}
                            onClick={() => setCurrentQIndex(i => Math.min(questions.length - 1, i + 1))}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors font-medium"
                        >
                            Next <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
