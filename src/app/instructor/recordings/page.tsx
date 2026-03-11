'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  getAllRecordings,
  deleteRecording,
  createRecording,
  updateRecording,
  Recording,
  CreateRecordingData,
  formatFileSize,
  formatDuration,
  formatRelativeTime,
  getQualityBadgeColor,
} from '@/lib/api/recordings';
import { sessionApi, Session as LiveSession } from '@/lib/api/sessions';
import AppLayout from '@/components/layout/AppLayout';

export default function InstructorRecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublic, setFilterPublic] = useState<'all' | 'public' | 'private'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Statistics
  const totalRecordings = recordings.length;
  const publicRecordings = recordings.filter((r) => r.isPublic).length;
  const totalViews = recordings.reduce((sum, r) => sum + r.viewCount, 0);
  const totalDuration = recordings.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);

  const fetchRecordings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllRecordings();
      setRecordings(data);
      setError('');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load recordings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;

    try {
      setDeletingId(id);
      await deleteRecording(id);
      setRecordings(recordings.filter((r) => r.id !== id));
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Failed to delete recording');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (recording: Recording) => {
    setEditingRecording(recording);
    setShowUploadModal(true);
  };

  const filteredRecordings = recordings.filter((r) => {
    // Filter by public/private
    if (filterPublic === 'public' && !r.isPublic) return false;
    if (filterPublic === 'private' && r.isPublic) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        r.session?.title?.toLowerCase().includes(query) ||
        r.session?.class?.name?.toLowerCase().includes(query) ||
        r.videoQuality?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Recordings</h1>
            <p className="mt-2 text-gray-600">
              Manage your session recordings and make them accessible to students
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Recordings</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{totalRecordings}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full"><svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Public</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">{publicRecordings}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full"><svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {totalViews.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full"><svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Duration</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {Math.floor(totalDuration / 60)}h {Math.floor(totalDuration % 60)}m
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full"><svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search recordings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter by Public/Private */}
              <select
                value={filterPublic}
                onChange={(e) => setFilterPublic(e.target.value as 'all' | 'public' | 'private')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Recordings</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
              </select>

              {/* Upload Button */}
              <button
                onClick={() => {
                  setEditingRecording(null);
                  setShowUploadModal(true);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
              >
                + Add Recording
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRecordings.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="flex justify-center mb-4"><svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No recordings yet</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || filterPublic !== 'all'
                  ? 'No recordings match your search criteria'
                  : 'Start by adding your first recording'}
              </p>
              {!searchQuery && filterPublic === 'all' && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Recording
                </button>
              )}
            </div>
          ) : (
            /* Recordings Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecordings.map((recording) => (
                <div key={recording.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gray-200">
                    {recording.thumbnailUrl ? (
                      <Image
                        src={recording.thumbnailUrl}
                        alt={recording.session?.title || 'Recording thumbnail'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    {/* Duration Badge */}
                    {recording.durationMinutes && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                        {formatDuration(recording.durationMinutes)}
                      </div>
                    )}
                    {/* Quality Badge */}
                    {recording.videoQuality && (
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${getQualityBadgeColor(recording.videoQuality)}`}>
                        {recording.videoQuality}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {recording.session?.title || 'Untitled Recording'}
                    </h3>

                    {recording.session?.class && (
                      <p className="text-sm text-gray-600 mb-2">
                        {recording.session.class.name}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>{recording.viewCount} views</span>
                      {recording.fileSize && <span>{formatFileSize(recording.fileSize)}</span>}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${recording.isPublic
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {recording.isPublic ? 'Public' : 'Private'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(recording.uploadedAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(recording.fileUrl, '_blank')}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        Play
                      </button>
                      <button
                        onClick={() => handleEdit(recording)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(recording.id)}
                        disabled={deletingId === recording.id}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium disabled:opacity-50"
                      >
                        {deletingId === recording.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload/Edit Modal */}
          {showUploadModal && (
            <RecordingModal
              recording={editingRecording}
              onClose={() => {
                setShowUploadModal(false);
                setEditingRecording(null);
              }}
              onSuccess={() => {
                setShowUploadModal(false);
                setEditingRecording(null);
                fetchRecordings();
              }}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// Recording Modal Component
function RecordingModal({
  recording,
  onClose,
  onSuccess,
}: {
  recording: Recording | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<CreateRecordingData>({
    sessionId: recording?.sessionId || '',
    fileUrl: recording?.fileUrl || '',
    fileSize: recording?.fileSize,
    durationMinutes: recording?.durationMinutes,
    videoQuality: recording?.videoQuality || '',
    thumbnailUrl: recording?.thumbnailUrl || '',
    isPublic: recording?.isPublic ?? false,
    metadata: recording?.metadata || {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Load instructor's sessions for the dropdown
  useEffect(() => {
    if (recording) return; // not needed when editing
    setSessionsLoading(true);
    sessionApi.getUpcomingSessions()
      .then((data) => setSessions(data))
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, [recording]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (recording) {
        // Update existing recording
        await updateRecording(recording.id, {
          fileUrl: formData.fileUrl,
          durationMinutes: formData.durationMinutes,
          videoQuality: formData.videoQuality,
          thumbnailUrl: formData.thumbnailUrl,
          isPublic: formData.isPublic,
          metadata: formData.metadata,
        });
      } else {
        // Create new recording
        await createRecording(formData);
      }
      onSuccess();
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to save recording');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {recording ? 'Edit Recording' : 'Add Recording'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              &times;
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Session dropdown (only for new recordings) */}
            {!recording && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session <span className="text-red-500">*</span>
                </label>
                {sessionsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    Loading your sessions...
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    No upcoming sessions found. Create a session first from the Live Sessions page.
                  </p>
                ) : (
                  <select
                    value={formData.sessionId}
                    onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">â€” Select a session â€”</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({new Date(s.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* File URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recording URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                required
                placeholder="https://example.com/recording.mp4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Direct URL to the video file (Zoom link, cloud storage, etc.)
              </p>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.durationMinutes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: Number(e.target.value) || undefined })
                }
                placeholder="60"
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Video Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video Quality
              </label>
              <select
                value={formData.videoQuality || ''}
                onChange={(e) => setFormData({ ...formData, videoQuality: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select quality</option>
                <option value="1080p">1080p (Full HD)</option>
                <option value="720p">720p (HD)</option>
                <option value="480p">480p (SD)</option>
                <option value="360p">360p</option>
              </select>
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={formData.thumbnailUrl || ''}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* File Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Size (bytes)
              </label>
              <input
                type="number"
                value={formData.fileSize || ''}
                onChange={(e) =>
                  setFormData({ ...formData, fileSize: Number(e.target.value) || undefined })
                }
                placeholder="524288000"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Size in bytes (e.g., 524288000 = 500 MB)
              </p>
            </div>

            {/* Is Public */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isPublic" className="ml-2 text-sm font-medium text-gray-700">
                Make this recording public
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-6 -mt-2">
              Public recordings are accessible to all authenticated users
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Saving...' : recording ? 'Update Recording' : 'Add Recording'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
