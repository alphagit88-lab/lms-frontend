'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  getContentById,
  checkContentAccess,
  downloadContent,
  incrementViewCount,
  Content,
  ContentAccessResponse,
  formatFileSize,
  getContentTypeIcon,
  getContentTypeLabel,
} from '@/lib/api/content';

export default function ContentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;

  const [content, setContent] = useState<Content | null>(null);
  const [access, setAccess] = useState<ContentAccessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [viewIncremented, setViewIncremented] = useState(false);

  const fetchContentDetails = useCallback(async () => {

    try {
      setLoading(true);
      const [contentData, accessData] = await Promise.all([
        getContentById(contentId),
        checkContentAccess(contentId),
      ]);
      
      setContent(contentData);
      setAccess(accessData);
      setError('');

      // Increment view count if user has access and hasn't done so yet
      if (accessData.hasAccess && !viewIncremented) {
        incrementViewCount(contentId).catch(console.error);
        setViewIncremented(true);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [contentId, viewIncremented]);

  useEffect(() => {
    if (contentId) {
      fetchContentDetails();
    }
  }, [contentId, fetchContentDetails]);

  const handleDownload = async () => {
    if (!access?.canDownload) return;

    try {
      setDownloading(true);
      const blob = await downloadContent(contentId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = content?.title || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh content to update download count
      const updatedContent = await getContentById(contentId);
      setContent(updatedContent);
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Failed to download content');
    } finally {
      setDownloading(false);
    }
  };

  const handlePurchase = () => {
    // TODO: Navigate to payment page when payment system is implemented
    alert('Payment system coming soon! This content costs $' + Number(content?.price ?? 0).toFixed(2));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This content does not exist or has been removed.'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Content Library
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="relative h-80 bg-linear-to-br from-blue-600 to-purple-600">
            {content.thumbnailUrl ? (
              <Image
                src={content.thumbnailUrl}
                alt={content.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-9xl">{getContentTypeIcon(content.contentType)}</div>
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
            
            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  {getContentTypeLabel(content.contentType)}
                </span>
                {content.isPaid ? (
                  <span className="px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-sm font-bold">
                    ${Number(content.price ?? 0).toFixed(2)}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-blue-500/90 backdrop-blur-sm rounded-full text-sm font-bold">
                    Free
                  </span>
                )}
                {content.isDownloadable && (
                  <span className="px-3 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full text-sm font-medium">
                    📥 Downloadable
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{content.title}</h1>
              <div className="flex items-center gap-4 text-sm">
                <span>{content.language}</span>
                <span>•</span>
                <span>👁️ {content.viewCount} views</span>
                {content.isDownloadable && (
                  <>
                    <span>•</span>
                    <span>⬇️ {content.downloadCount} downloads</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-8">
            {/* Access Control Section */}
            {access && (
              <div className="mb-8">
                {access.hasAccess ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">✅</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-900 mb-2">
                          You have access to this content
                        </h3>
                        <p className="text-green-700 mb-4">{access.reason}</p>
                        
                        <div className="flex gap-3">
                          {access.canDownload && content.isDownloadable && (
                            <button
                              onClick={handleDownload}
                              disabled={downloading}
                              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {downloading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* View button for videos/documents */}
                          {(content.contentType === 'video' || content.contentType === 'pdf') && (
                            <button
                              onClick={() => window.open(content.fileUrl, '_blank')}
                              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Content
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">🔒</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                          Access Required
                        </h3>
                        <p className="text-yellow-700 mb-4">{access.reason}</p>
                        
                        {content.isPaid ? (
                          <button
                            onClick={handlePurchase}
                            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Purchase for ${Number(content.price ?? 0).toFixed(2)}
                          </button>
                        ) : (
                          <p className="text-sm text-yellow-600">
                            Please enroll in the related course to access this content.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {content.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{content.description}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Details Card */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Details</h3>
                <div className="space-y-3">
                  {content.subject && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subject:</span>
                      <span className="font-medium text-gray-900">{content.subject}</span>
                    </div>
                  )}
                  {content.grade && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grade:</span>
                      <span className="font-medium text-gray-900">{content.grade}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language:</span>
                    <span className="font-medium text-gray-900">{content.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">File Size:</span>
                    <span className="font-medium text-gray-900">{formatFileSize(content.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900">{getContentTypeLabel(content.contentType)}</span>
                  </div>
                </div>
              </div>

              {/* Instructor Card */}
              {content.teacher && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center">
                      {content.teacher.firstName[0]}{content.teacher.lastName[0]}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {content.teacher.firstName} {content.teacher.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{content.teacher.email}</p>
                      <button
                        onClick={() => router.push(`/teachers/${content.teacherId}`)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Profile →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">👁️</div>
                  <div className="text-2xl font-bold text-gray-900">{content.viewCount}</div>
                  <div className="text-sm text-gray-600">Views</div>
                </div>
                {content.isDownloadable && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-3xl mb-2">⬇️</div>
                    <div className="text-2xl font-bold text-gray-900">{content.downloadCount}</div>
                    <div className="text-sm text-gray-600">Downloads</div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">📅</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(content.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">Published</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">
                    {content.isPaid ? '💰' : '🆓'}
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {content.isPaid ? `$${Number(content.price ?? 0).toFixed(2)}` : 'Free'}
                  </div>
                  <div className="text-sm text-gray-600">Price</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
