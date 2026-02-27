'use client';

import React, { useState, useEffect } from 'react';
import { Session, sessionApi } from '@/lib/api/sessions';
import { SessionCard } from '@/components/session/SessionCard';
import { Loader2, Calendar } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

export default function StudentSessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const data = await sessionApi.getUpcomingSessions();
            setSessions(data);
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setError('Failed to load upcoming sessions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <AppLayout>
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">My Live Classes</h1>
                    <p className="text-slate-500 font-medium mt-1">Join your scheduled sessions and interactive classes</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium text-sm">Loading your sessions...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-8 rounded-[32px] border border-red-100 text-center font-semibold">
                        {error}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="bg-white rounded-[40px] border border-slate-100 py-32 text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100">
                            <Calendar className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-semibold text-slate-900 mb-2">No Scheduled Sessions</h3>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium">
                            You haven&apos;t booked any live sessions or joined any group classes yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {sessions.map((session) => (
                            <SessionCard key={session.id} session={session} />
                        ))}
                    </div>
                )}
            </AppLayout>
        </ProtectedRoute>
    );
}
