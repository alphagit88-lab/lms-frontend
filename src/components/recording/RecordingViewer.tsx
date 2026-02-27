'use client';

import React from 'react';
import { Recording, formatDuration, formatFileSize } from '@/lib/api/recordings';
import { Play, Download, Clock, Database, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface RecordingViewerProps {
    recording: Recording;
}

export const RecordingViewer: React.FC<RecordingViewerProps> = ({ recording }) => {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
            {/* Video Player Placeholder / Iframe */}
            <div className="aspect-video bg-black relative flex items-center justify-center">
                {recording.fileUrl ? (
                    <iframe
                        src={recording.fileUrl}
                        className="w-full h-full"
                        allowFullScreen
                    />
                ) : (
                    <div className="text-center text-gray-500">
                        <Play className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Video processing or URL missing</p>
                    </div>
                )}
            </div>

            <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{recording.session?.title || 'Class Recording'}</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-blue-500" />
                                {format(new Date(recording.createdAt), 'MMMM do, yyyy')}
                            </span>
                            <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1 text-green-500" />
                                {formatDuration(recording.durationMinutes)}
                            </span>
                            <span className="flex items-center">
                                <Database className="w-4 h-4 mr-1 text-purple-500" />
                                {formatFileSize(recording.fileSize)}
                            </span>
                        </div>
                    </div>

                    {recording.downloadUrl && (
                        <a
                            href={recording.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </a>
                    )}
                </div>

                <div className="prose prose-blue max-w-none">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">About this Session</h3>
                    <p className="text-gray-600">
                        This is the recording for the session held on {format(new Date(recording.session?.startTime || recording.createdAt), 'PPPP')}.
                        {recording.session?.class && ` It was part of the class "${recording.session.class.name}".`}
                    </p>
                </div>
            </div>
        </div>
    );
};
