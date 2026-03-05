'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { examApi, Exam, Question, CreateExamPayload, CreateQuestionPayload, QuestionOption } from '@/lib/api/exams';
import { getMyCourses, Course } from '@/lib/api/courses';
import { Plus, Save, Trash2, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export const ExamBuilder = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const editId = searchParams.get('edit');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const [exam, setExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);

    // Exam Form
    const [examData, setExamData] = useState<CreateExamPayload>({
        courseId: '',
        title: '',
        examType: 'quiz',
        totalMarks: 100,
        passingMarks: 50,
        durationMinutes: 60,
    });

    // Question Builder
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [questionData, setQuestionData] = useState<CreateQuestionPayload>({
        questionText: '',
        questionType: 'multiple_choice',
        marks: 5,
        orderIndex: 0,
        options: [
            { optionText: '', isCorrect: true, orderIndex: 0 },
            { optionText: '', isCorrect: false, orderIndex: 1 },
        ]
    });

    useEffect(() => {
        const init = async () => {
            try {
                const c = await getMyCourses();
                setCourses(c);
                if (c.length > 0) setExamData(d => ({ ...d, courseId: c[0].id }));

                if (editId) {
                    const loadedExam = await examApi.getExamById(editId);
                    setExam(loadedExam);
                    if (loadedExam.questions) setQuestions(loadedExam.questions);
                }
            } catch (err) {
                console.error("Failed to load builder context", err);
                alert("Failed to load instructor courses.");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [editId]);

    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const created = await examApi.createExam(examData);
            setExam(created);
            router.replace(`/instructor/exams/create?edit=${created.id}`, { scroll: false });
        } catch (err) {
            console.error(err);
            alert("Failed to create exam skeleton.");
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!exam) return;
        try {
            setSaving(true);
            const pub = await examApi.publishExam(exam.id);
            setExam(pub);
            alert("Exam published seamlessly! Students can now see it.");
            router.push('/instructor/exams');
        } catch (err) {
            alert("Failed to publish.");
        } finally {
            setSaving(false);
        }
    }

    const saveQuestion = async () => {
        if (!exam) return;

        // Validation
        if (!questionData.questionText) { return alert("Question text is required."); }
        if (questionData.questionType === 'multiple_choice') {
            const hasCorrect = questionData.options?.some(o => o.isCorrect);
            if (!hasCorrect) return alert("You must select at least one correct option for MCQs.");
        }

        try {
            setSaving(true);
            const payload = { ...questionData, orderIndex: questions.length };

            // Clean options if Essay
            if (payload.questionType === 'essay') {
                payload.options = [];
            }

            const q = await examApi.createQuestion(exam.id, payload);

            // Reload exam questions cleanly
            const updatedExam = await examApi.getExamById(exam.id);
            if (updatedExam.questions) setQuestions(updatedExam.questions);

            setIsAddingQuestion(false);
            // Reset question form
            setQuestionData({
                questionText: '',
                questionType: 'multiple_choice',
                marks: 5,
                orderIndex: questions.length + 1,
                options: [
                    { optionText: '', isCorrect: true, orderIndex: 0 },
                    { optionText: '', isCorrect: false, orderIndex: 1 },
                ]
            });
        } catch (err) {
            alert("Failed to save question.");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const deleteQuestion = async (qId: string) => {
        try {
            await examApi.deleteQuestion(qId);
            setQuestions(prev => prev.filter(q => q.id !== qId));
        } catch (err) {
            alert("Failed to remove question.");
        }
    }

    if (loading) return <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>;

    if (!exam) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 1: Exam Details</h2>
                <form onSubmit={handleCreateExam} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Course</label>
                        <select
                            required
                            value={examData.courseId}
                            onChange={e => setExamData({ ...examData, courseId: e.target.value })}
                            className="w-full border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border"
                        >
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
                            <input
                                required
                                placeholder="e.g. Midterm Physics Test"
                                value={examData.title}
                                onChange={e => setExamData({ ...examData, title: e.target.value })}
                                className="w-full border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                            <select
                                value={examData.examType}
                                onChange={e => setExamData({ ...examData, examType: e.target.value })}
                                className="w-full border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border"
                            >
                                <option value="quiz">Short Quiz</option>
                                <option value="assignment">Assignment</option>
                                <option value="test">Standard Test</option>
                                <option value="final_exam">Final Exam</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                            <input
                                type="number"
                                value={examData.totalMarks}
                                onChange={e => setExamData({ ...examData, totalMarks: parseInt(e.target.value) || 0 })}
                                className="w-full border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Minutes)</label>
                            <input
                                type="number"
                                value={examData.durationMinutes}
                                onChange={e => setExamData({ ...examData, durationMinutes: parseInt(e.target.value) || 0 })}
                                className="w-full border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Language</label>
                            <select
                                value={examData.language || 'english'}
                                onChange={e => setExamData({ ...examData, language: e.target.value })}
                                className="w-full border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border"
                            >
                                <option value="english">English</option>
                                <option value="sinhala">සිංහල (Sinhala)</option>
                                <option value="tamil">தமிழ் (Tamil)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks</label>
                            <input
                                type="number"
                                value={examData.passingMarks || ''}
                                onChange={e => setExamData({ ...examData, passingMarks: parseInt(e.target.value) || undefined })}
                                placeholder="Optional"
                                className="w-full border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts</label>
                            <input
                                type="number"
                                min={1}
                                value={examData.maxAttempts || 1}
                                onChange={e => setExamData({ ...examData, maxAttempts: parseInt(e.target.value) || 1 })}
                                className="w-full border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white rounded-lg p-3 font-semibold hover:bg-blue-700 transition"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                        Save Details & Add Questions
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{exam.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {exam.examType.toUpperCase()} • {exam.durationMinutes} Mins • {questions.reduce((sum, q) => sum + parseFloat(q.marks.toString()), 0)} / {exam.totalMarks} Marks Built
                    </p>
                </div>
                <button
                    onClick={handlePublish}
                    className={`px-5 py-2.5 rounded-lg font-bold text-white transition-colors flex items-center gap-2 ${exam.isPublished ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                >
                    {exam.isPublished ? <CheckCircle2 className="w-5 h-5" /> : null}
                    {exam.isPublished ? 'Live / Published' : 'Publish Test Now'}
                </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {questions.map((q, idx) => (
                    <div key={q.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative group">
                        <button onClick={() => deleteQuestion(q.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="flex gap-4">
                            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                {idx + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-2">
                                    <h4 className="font-medium text-gray-900">{q.questionText}</h4>
                                    <span className="text-sm font-bold text-gray-400">{q.marks} Marks</span>
                                </div>

                                {q.questionType === 'multiple_choice' && q.options && (
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {q.options.map((opt, i) => (
                                            <div key={opt.id} className={`p-3 rounded-lg border text-sm ${opt.isCorrect ? 'bg-green-50 border-green-200 text-green-800 font-medium' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                                {String.fromCharCode(65 + i)}. {opt.optionText}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {q.questionType === 'essay' && (
                                    <div className="mt-3 p-4 bg-yellow-50/50 border border-yellow-100 rounded-lg text-sm text-yellow-800 italic">
                                        Students will hand-type an essay or upload a picture of a handwritten document here.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add New Question Form */}
            {isAddingQuestion ? (
                <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 border-dashed">
                    <h3 className="font-bold text-lg text-blue-900 mb-4">Add a New Question</h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                                <select
                                    value={questionData.questionType}
                                    onChange={e => setQuestionData({ ...questionData, questionType: e.target.value })}
                                    className="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="multiple_choice">Multiple Choice (MCQ)</option>
                                    <option value="essay">Written Essay / OCR Upload</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Marks Attached</label>
                                <input
                                    type="number"
                                    value={questionData.marks}
                                    onChange={e => setQuestionData({ ...questionData, marks: parseFloat(e.target.value) || 0 })}
                                    className="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question Prompt</label>
                            <textarea
                                rows={3}
                                value={questionData.questionText}
                                onChange={e => setQuestionData({ ...questionData, questionText: e.target.value })}
                                className="w-full border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                                placeholder="E.g. Explain Newton's First Law..."
                            />
                        </div>

                        {questionData.questionType === 'multiple_choice' && (
                            <div className="space-y-3 pt-4 border-t border-blue-200">
                                <label className="block text-sm font-bold text-gray-800">Answers (Check the correct ones)</label>
                                {questionData.options?.map((opt, idx) => (
                                    <div key={idx} className="flex gap-3 items-center">
                                        <input
                                            type="radio"
                                            name="correctOption"
                                            checked={opt.isCorrect}
                                            onChange={() => {
                                                const newOpts = questionData.options!.map((o, i) => ({ ...o, isCorrect: i === idx }));
                                                setQuestionData({ ...questionData, options: newOpts });
                                            }}
                                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <input
                                            value={opt.optionText}
                                            onChange={(e) => {
                                                const newOpts = [...questionData.options!];
                                                newOpts[idx].optionText = e.target.value;
                                                setQuestionData({ ...questionData, options: newOpts });
                                            }}
                                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                            className="flex-1 border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => {
                                                const newOpts = questionData.options!.filter((_, i) => i !== idx);
                                                setQuestionData({ ...questionData, options: newOpts });
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        setQuestionData({
                                            ...questionData,
                                            options: [...questionData.options!, { optionText: '', isCorrect: false, orderIndex: questionData.options!.length }]
                                        });
                                    }}
                                    className="text-sm text-blue-600 font-medium hover:underline mt-2 inline-block"
                                >
                                    + Add Option
                                </button>
                            </div>
                        )}

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                onClick={() => setIsAddingQuestion(false)}
                                className="px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-200 font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveQuestion}
                                disabled={saving}
                                className="px-5 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold shadow-sm flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Push Question to Test
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAddingQuestion(true)}
                    className="w-full flex justify-center items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-blue-400 hover:text-blue-600 transition-colors hover:bg-blue-50/50"
                >
                    <Plus className="w-6 h-6" />
                    Drop a New Question Here
                </button>
            )}
        </div>
    );
}
