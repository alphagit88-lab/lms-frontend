'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Session, sessionApi } from '@/lib/api/sessions';
import { JoinButton } from '@/components/session/JoinButton';
import { ChevronLeft, Loader2, Calendar, Clock, Video, Lock, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function SessionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                setLoading(true);
                const data = await sessionApi.getSessionById(id);
                setSession(data);
            } catch (err) {
                console.error('Error fetching session:', err);
                setError('Failed to load session details. It may not exist or you may not have access.');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchSession();
    }, [id]);

    const handleStatusChange = (updated: Session) => setSession(updated);

    const statusColors: Record<string, string> = {
        scheduled: 'bg-blue-100 text-blue-800',
        in_progress: 'bg-green-100 text-green-800',
        completed: 'bg-gray-100 text-gray-700',
        cancelled: 'bg-red-100 text-red-700',
    };

    return (
        <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
            <div className="p-8 max-w-3xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-500 hover:text-gray-900 mb-8 group transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500">Loading session...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-12 text-center">
                        <Lock className="w-10 h-10 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Session Not Accessible</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => router.push('/sessions')}
                            className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        >
                            My Sessions
                        </button>
                    </div>
                ) : session ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="p-8 border-b border-gray-50">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3 ${statusColors[session.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                        {session.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
                                    {session.description && (
                                        <p className="mt-2 text-gray-500">{session.description}</p>
                                    )}
                                </div>
                                <div className="p-3 bg-blue-50 rounded-xl shrink-0">
                                    <Video className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-8 space-y-5">
                            <div className="flex items-center text-gray-700">
                                <Calendar className="w-5 h-5 mr-3 text-blue-500 shrink-0" />
                                <span className="font-medium">{format(new Date(session.startTime), 'EEEE, MMMM do, yyyy')}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <Clock className="w-5 h-5 mr-3 text-green-500 shrink-0" />
                                <span>
                                    {format(new Date(session.startTime), 'h:mm a')}
                                    {' – '}
                                    {format(new Date(session.endTime), 'h:mm a')}
                                    <span className="ml-2 text-gray-400 text-sm">
                                        ({Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)} min)
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <Video className="w-5 h-5 mr-3 text-purple-500 shrink-0" />
                                <span className="capitalize">{session.sessionType.replace('_', ' ')} session</span>
                            </div>

                            {session.meetingLink && (
                                <div className="flex items-center text-gray-700 break-all">
                                    <LinkIcon className="w-5 h-5 mr-3 text-gray-400 shrink-0" />
                                    <a
                                        href={session.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        {session.meetingLink}
                                    </a>
                                </div>
                            )}

                            {session.meetingPassword && (
                                <div className="flex items-center text-gray-700">
                                    <Lock className="w-5 h-5 mr-3 text-gray-400 shrink-0" />
                                    <span className="text-sm">
                                        Meeting password:{' '}
                                        <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">{session.meetingPassword}</code>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action */}
                        <div className="px-8 pb-8">
                            <JoinButton session={session} onStatusChange={handleStatusChange} />
                        </div>
                    </div>
                ) : null}
            </div>
        </ProtectedRoute>
    );
}
