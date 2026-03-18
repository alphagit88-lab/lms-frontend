'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Recording, getRecordingById } from '@/lib/api/recordings';
import { RecordingViewer } from '@/components/recording/RecordingViewer';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

export default function RecordingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [recording, setRecording] = useState<Recording | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecording = async () => {
            try {
                setLoading(true);
                const data = await getRecordingById(id);
                setRecording(data);
            } catch (err) {
                console.error('Error fetching recording:', err);
                setError('Failed to load recording. It might be private or deleted.');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchRecording();
    }, [id]);

    return (
        <ProtectedRoute allowedRoles={['student', 'instructor', 'admin', 'parent']}>
            <AppLayout>
                <div className="p-8 max-w-5xl mx-auto">
                    <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-500 hover:text-gray-900 mb-8 group transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Back to Sessions
                </button>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500">Loading recording...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Recording Not Accessible</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => router.push('/sessions')}
                            className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        >
                            Go to My Sessions
                        </button>
                    </div>
                ) : recording ? (
                    <RecordingViewer recording={recording} />
                ) : null}
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
