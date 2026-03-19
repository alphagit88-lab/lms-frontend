'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Recording, getAllRecordings, formatDuration, formatRelativeTime } from '@/lib/api/recordings';
import { Loader2, Video, Clock, Eye, AlertCircle, Play } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

function RecordingCard({ recording }: { recording: Recording }) {
    return (
        <Link
            href={`/recordings/${recording.id}`}
            className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
        >
            {/* Thumbnail */}
            <div className="relative w-full h-40 bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                {recording.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={recording.thumbnailUrl}
                        alt="Recording thumbnail"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Video className="w-12 h-12 text-blue-300" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        <Play className="w-5 h-5 text-blue-600 ml-1" />
                    </div>
                </div>
                {recording.durationMinutes && (
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-md">
                        {formatDuration(recording.durationMinutes)}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                    {recording.session?.title ?? 'Untitled Recording'}
                </h3>
                {recording.session?.class?.name && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-1">
                        {recording.session.class.name}
                    </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {recording.viewCount} views
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatRelativeTime(recording.uploadedAt)}
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default function RecordingsPage() {
    const { user } = useAuth();
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const fetchRecordings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllRecordings({ isPublic: true });
            setRecordings(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching recordings:', err);
            setError('Failed to load recordings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecordings();
    }, [fetchRecordings]);

    const filtered = recordings.filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            r.session?.title?.toLowerCase().includes(q) ||
            r.session?.class?.name?.toLowerCase().includes(q)
        );
    });

    return (
        <ProtectedRoute allowedRoles={['student', 'instructor', 'admin', 'parent']}>
            <AppLayout>
                <div className="p-8 max-w-7xl mx-auto">
                    {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Recordings</h1>
                        <p className="text-gray-500 mt-1">Watch past session recordings at your own pace</p>
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search recordings…"
                        className="w-full sm:w-64 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500">Loading recordings…</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                        <p className="text-red-600 font-medium mb-2">{error}</p>
                        <button
                            onClick={fetchRecordings}
                            className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 py-20 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Video className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {search ? 'No Recordings Found' : 'No Recordings Yet'}
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            {search
                                ? `No recordings match "${search}". Try a different search term.`
                                : 'Session recordings will appear here once they are processed and made available.'}
                        </p>
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                Clear Search
                            </button>
                        )}

                        {user?.role === 'instructor' && (
                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <p className="text-gray-500 mb-3 font-medium">Are you an instructor looking for your session recordings?</p>
                                <div className="flex flex-col items-center gap-2">
                                    <Link
                                        href="/instructor/recordings"
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 font-medium transition-colors"
                                    >
                                        Go to Instructor Recordings
                                    </Link>
                                    <p className="text-xs text-slate-400 max-w-xs">
                                        Note: This page only shows public recordings. Your session recordings are private by default.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-500 mb-4">
                            {filtered.length} recording{filtered.length !== 1 ? 's' : ''}
                            {search && ` for "${search}"`}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filtered.map(recording => (
                                <RecordingCard key={recording.id} recording={recording} />
                            ))}
                        </div>
                    </>
                )}
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
