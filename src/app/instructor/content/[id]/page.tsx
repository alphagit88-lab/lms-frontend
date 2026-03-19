'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  getContentById,
  ContentType,
  getContentTypeLabel,
  getContentTypeIcon,
  formatFileSize,
  Content,
  getContentStreamUrl,
  incrementViewCount
} from '@/lib/api/content';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ContentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const data = await getContentById(id);
        setContent(data);
        
        // Asynchronously increment view count
        incrementViewCount(id).catch(err => console.error('Failed to increment view count', err));
      } catch (err) {
        setError((err as Error).message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !content) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Content not found'}</p>
          <button
            onClick={() => router.push('/instructor/content')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </AppLayout>
    );
  }

  const streamUrl = getContentStreamUrl(id);

  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <AppLayout>
        <div className="max-w-6xl mx-auto py-8 px-4">
          {/* Breadcrumbs / Back */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/instructor/content')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              ← Back to Library
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area (Preview & Description) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Preview Container */}
              <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <h2 className="font-semibold text-gray-900">Preview</h2>
                  <span className="text-xs text-gray-500 italic">
                    Note: Previews depend on file type and browser capability
                  </span>
                </div>
                
                <div className="bg-gray-900 aspect-video flex items-center justify-center relative">
                  {content.contentType === ContentType.VIDEO ? (
                    <video 
                      src={streamUrl} 
                      controls 
                      className="w-full h-full"
                      poster={content.thumbnailUrl}
                    />
                  ) : content.contentType === ContentType.AUDIO ? (
                    <div className="w-full px-8 py-12">
                       <div className="text-6xl text-center mb-6">🎵</div>
                       <audio src={streamUrl} controls className="w-full" />
                    </div>
                  ) : content.contentType === ContentType.PDF ? (
                    <iframe 
                      src={`${streamUrl}#toolbar=0`} 
                      className="w-full h-full"
                      title={content.title}
                    />
                  ) : (
                    <div className="text-center text-white">
                      <div className="text-8xl mb-4">{getContentTypeIcon(content.contentType)}</div>
                      <p>Preview not available for this file type</p>
                      <a 
                        href={streamUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 inline-block px-4 py-2 bg-white/10 hover:bg-white/20 rounded transition"
                      >
                        Open in New Tab
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Description & Details */}
              <div className="bg-white rounded-xl shadow p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{content.title}</h1>
                
                <div className="prose max-w-none text-gray-700 mb-8 whitespace-pre-wrap">
                  {content.description || 'No description provided.'}
                </div>

                <div className="border-t pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Subject</p>
                    <p className="text-gray-900">{content.subject || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Grade</p>
                    <p className="text-gray-900">{content.grade || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Language</p>
                    <p className="text-gray-900">{content.language}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Total Views</p>
                    <p className="text-gray-900">{(content.viewCount ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar (Actions & Info) */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-600">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">{getContentTypeIcon(content.contentType)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">File Type</p>
                    <p className="text-gray-900 font-bold">{getContentTypeLabel(content.contentType)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center py-2 border-b">
                     <span className="text-gray-600">File Size</span>
                     <span className="font-medium text-gray-900">{formatFileSize(content.fileSize)}</span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b">
                     <span className="text-gray-600">Pricing</span>
                     <span className={`font-bold ${content.isPaid ? 'text-green-600' : 'text-blue-600'}`}>
                       {content.isPaid ? `$${Number(content.price ?? 0).toFixed(2)}` : 'Free'}
                     </span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b">
                     <span className="text-gray-600">Status</span>
                     <span className={`px-2 py-0.5 rounded text-xs ${content.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                       {content.isPublished ? 'Published' : 'Draft'}
                     </span>
                   </div>
                   <div className="flex justify-between items-center py-2">
                     <span className="text-gray-600">Downloads</span>
                     <span className="font-medium text-gray-900">{(content.downloadCount ?? 0).toLocaleString()}</span>
                   </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    onClick={() => router.push(`/instructor/content/${content.id}/edit`)}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-medium transition flex items-center justify-center gap-2"
                  >
                    ✏️ Edit Metadata
                  </button>
                  {content.isDownloadable && (
                    <a
                      href={`${getContentStreamUrl(id)}?download=true`}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition flex items-center justify-center gap-2"
                    >
                      ⬇️ Download Original
                    </a>
                  )}
                </div>
              </div>

              {/* Created Info */}
              <div className="bg-white rounded-xl shadow p-6 text-sm">
                <p className="text-gray-500 mb-1">Uploaded On</p>
                <p className="text-gray-900 font-medium mb-4">
                  {new Date(content.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-gray-500 mb-1">Last Updated</p>
                <p className="text-gray-900 font-medium">
                  {new Date(content.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
