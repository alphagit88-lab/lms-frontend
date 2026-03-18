'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getRecordingById, Recording, formatDuration, formatFileSize } from '@/lib/api/recordings';

interface RecordingPlayerProps {
  recordingId?: string;
  recording?: Recording;
  autoplay?: boolean;
  showDetails?: boolean;
  className?: string;
}

export default function RecordingPlayer({
  recordingId,
  recording: initialRecording,
  autoplay = false,
  showDetails = true,
  className = '',
}: RecordingPlayerProps) {
  const [recording, setRecording] = useState<Recording | null>(initialRecording || null);
  const [loading, setLoading] = useState(!initialRecording && !!recordingId);
  const [error, setError] = useState('');

  const fetchRecording = useCallback(async () => {
    if (!recordingId) return;

    try {
      setLoading(true);
      const data = await getRecordingById(recordingId);
      setRecording(data);
      setError('');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load recording');
    } finally {
      setLoading(false);
    }
  }, [recordingId]);

  useEffect(() => {
    if (recordingId && !initialRecording) {
      fetchRecording();
    }
  }, [recordingId, initialRecording, fetchRecording]);

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recording...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Recording</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchRecording}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!recording) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">🎥</div>
          <p className="text-gray-600">No recording available</p>
        </div>
      </div>
    );
  }

  // Check if the URL is a Zoom recording, YouTube, or direct video
  const isZoomRecording = recording.fileUrl.includes('zoom.us');
  const isYouTube =
    recording.fileUrl.includes('youtube.com') || recording.fileUrl.includes('youtu.be');
  const isDirectVideo = recording.fileUrl.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Video Player */}
      <div className="relative bg-black" style={{ paddingBottom: '56.25%' }}>
        {/* 16:9 Aspect Ratio */}
        <div className="absolute inset-0">
          {isZoomRecording ? (
            // Zoom recordings typically need to be opened in new window
            <div className="flex items-center justify-center h-full bg-gray-900 text-white p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🎥</div>
                <h3 className="text-xl font-semibold mb-4">Zoom Recording</h3>
                <p className="text-gray-300 mb-6">
                  This recording is hosted on Zoom. Click the button below to watch.
                </p>
                <a
                  href={recording.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  ▶️ Watch on Zoom
                </a>
              </div>
            </div>
          ) : isYouTube ? (
            // YouTube embed
            <iframe
              src={getYouTubeEmbedUrl(recording.fileUrl)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          ) : isDirectVideo ? (
            // Direct video file
            <video
              src={recording.fileUrl}
              controls
              autoPlay={autoplay}
              className="w-full h-full"
              poster={recording.thumbnailUrl}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            // Generic link (could be Google Drive, Dropbox, etc.)
            <div className="flex items-center justify-center h-full bg-gray-900 text-white p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🎥</div>
                <h3 className="text-xl font-semibold mb-4">External Recording</h3>
                <p className="text-gray-300 mb-6">
                  This recording is hosted externally. Click the button below to watch.
                </p>
                <a
                  href={recording.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  ▶️ Watch Recording
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recording Details */}
      {showDetails && (
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {recording.session?.title || 'Recording'}
          </h3>

          {recording.session?.class && (
            <p className="text-gray-600 mb-4">📚 {recording.session.class.name}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {recording.durationMinutes && (
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-semibold text-gray-900">
                  ⏱️ {formatDuration(recording.durationMinutes)}
                </p>
              </div>
            )}

            {recording.videoQuality && (
              <div>
                <p className="text-sm text-gray-500">Quality</p>
                <p className="font-semibold text-gray-900">🎬 {recording.videoQuality}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500">Views</p>
              <p className="font-semibold text-gray-900">👁️ {recording.viewCount.toLocaleString()}</p>
            </div>

            {recording.fileSize && (
              <div>
                <p className="text-sm text-gray-500">File Size</p>
                <p className="font-semibold text-gray-900">💾 {formatFileSize(recording.fileSize)}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                recording.isPublic
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {recording.isPublic ? '🌐 Public' : '🔒 Private'}
            </span>

            <span className="text-sm text-gray-500">
              Uploaded{' '}
              {new Date(recording.uploadedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Session Time */}
          {recording.session && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Session:{' '}
                {new Date(recording.session.startTime).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Convert YouTube URL to embed URL
 */
function getYouTubeEmbedUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

/**
 * Compact version of the player (for embedding in lists)
 */
export function RecordingPlayerCompact({
  recording,
  onClick,
}: {
  recording: Recording;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gray-200">
        {recording.thumbnailUrl ? (
          <Image
            src={recording.thumbnailUrl}
            alt={recording.session?.title || 'Recording'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-5xl">🎥</div>
        )}
        {recording.durationMinutes && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
            {formatDuration(recording.durationMinutes)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {recording.session?.title || 'Recording'}
        </h4>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>👁️ {recording.viewCount}</span>
          {recording.videoQuality && <span>🎬 {recording.videoQuality}</span>}
        </div>
      </div>
    </div>
  );
}
