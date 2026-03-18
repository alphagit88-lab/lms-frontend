'use client';

import React, { useState, useEffect } from 'react';
import { Session, sessionApi, CreateSessionPayload } from '@/lib/api/sessions';
import { SessionCard } from '@/components/session/SessionCard';
import { Loader2, Calendar, Plus, X } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

function CreateSessionModal({ onClose, onCreate }: { onClose: () => void; onCreate: (s: Session) => void }) {
    const [form, setForm] = useState<CreateSessionPayload>({
        title: '',
        startTime: '',
        endTime: '',
        description: '',
        sessionType: 'live',
        createZoomMeeting: true,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!form.title || !form.startTime || !form.endTime) {
            setError('Title, start time, and end time are required.');
            return;
        }
        if (new Date(form.endTime) <= new Date(form.startTime)) {
            setError('End time must be after start time.');
            return;
        }
        try {
            setSubmitting(true);
            const session = await sessionApi.createSession(form);
            onCreate(session);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create session.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Create New Session</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="e.g. Introduction to Algebra"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                            <input
                                type="datetime-local"
                                name="startTime"
                                value={form.startTime}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                            <input
                                type="datetime-local"
                                name="endTime"
                                value={form.endTime}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                        <select
                            name="sessionType"
                            value={form.sessionType}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="live">Live</option>
                            <option value="recorded">Recorded</option>
                            <option value="hybrid">Hybrid</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Optional session notes..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="createZoomMeeting"
                            checked={form.createZoomMeeting}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Auto-create Zoom meeting link</span>
                    </label>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {submitting ? 'Creating…' : 'Create Session'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function InstructorSessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

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

    const handleStatusChange = (updatedSession: Session) => {
        setSessions(prev =>
            prev.map(s => s.id === updatedSession.id ? updatedSession : s)
        );
    };

    const handleSessionCreated = (session: Session) => {
        setSessions(prev => [session, ...prev]);
        setShowCreateModal(false);
    };

    return (
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <AppLayout>
                <div className="p-8 max-w-7xl mx-auto">
                    {showCreateModal && (
                        <CreateSessionModal
                            onClose={() => setShowCreateModal(false)}
                            onCreate={handleSessionCreated}
                        />
                    )}

                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Live Sessions</h1>
                            <p className="text-gray-500 mt-1">Manage and start your upcoming live classes</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={fetchSessions}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Refresh
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create Session
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-500">Loading your sessions...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
                            {error}
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 py-20 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Upcoming Sessions</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mb-6">
                                You don&apos;t have any scheduled sessions yet. Confirm a booking or create a session to get started.
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create Your First Session
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sessions.map((session) => (
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    onStatusChange={handleStatusChange}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
