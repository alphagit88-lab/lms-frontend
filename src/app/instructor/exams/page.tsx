'use client';

import React, { useState, useEffect } from 'react';
import { Exam, examApi } from '@/lib/api/exams';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { Plus, FileText, Calendar, Clock, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function InstructorExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const data = await examApi.getMyExams();
            setExams(data);
        } catch (err) {
            console.error('Failed to fetch exams:', err);
            setError('Could not load exams. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this exam? This action cannot be undone.")) return;
        try {
            await examApi.deleteExam(id);
            setExams(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            alert('Failed to delete exam.');
            console.error(err);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <AppLayout>
                <div className="p-8 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Exams & Assessments</h1>
                            <p className="text-gray-500 mt-1">Manage quizzes, assignments, and exams for your courses.</p>
                        </div>
                        <Link
                            href="/instructor/exams/create"
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Create Exam
                        </Link>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 shadow-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No exams found</h3>
                            <p className="text-gray-500 max-w-sm mb-6">
                                You haven&apos;t created any exams or assessments yet. Create your first exam to evaluate your students.
                            </p>
                            <Link
                                href="/instructor/exams/create"
                                className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                            >
                                Create an Exam
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {exams.map((exam) => (
                                <div key={exam.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col hover:border-blue-100 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 mb-2">
                                            {exam.examType.replace('_', ' ')}
                                        </div>
                                        <div className="flex gap-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${exam.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {exam.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{exam.title}</h3>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">
                                        Course: {exam.course?.title || 'Unknown Course'}
                                    </p>

                                    <div className="mt-auto space-y-2 mb-6">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            {exam.examDate ? format(new Date(exam.examDate), 'MMM d, yyyy') : 'No Date Set'}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                            {exam.durationMinutes ? `${exam.durationMinutes} Minutes` : 'Untimed'}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <FileText className="w-4 h-4 mr-2 text-gray-400" />
                                            {exam.totalMarks} Marks
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDelete(exam.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                title="Delete Exam"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {exam.isPublished && (
                                                <Link
                                                    href={`/instructor/exams/${exam.id}/grade`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Grade
                                                </Link>
                                            )}
                                            <Link
                                                href={`/instructor/exams/create?edit=${exam.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                                Edit Builder
                                            </Link>
                                        </div>
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
