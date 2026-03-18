'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  getAllContent,
  Content,
  ContentType,
  ContentFilters,
  formatFileSize,
  getContentTypeIcon,
  getContentTypeLabel,
} from '@/lib/api/content';

export default function ContentDiscoveryPage() {
  const router = useRouter();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType | ''>('');
  const [selectedPaid, setSelectedPaid] = useState<'all' | 'paid' | 'free'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Get unique subjects for filter (with safety check)
  const uniqueSubjects = Array.from(
    new Set(
      Array.isArray(contents) 
        ? contents.map((c) => c.subject).filter(Boolean)
        : []
    )
  ) as string[];

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const filters: ContentFilters = {
        isPublished: true, // Only show published content
      };
      if (selectedType) filters.contentType = selectedType;
      if (selectedPaid === 'paid') filters.isPaid = true;
      if (selectedPaid === 'free') filters.isPaid = false;

      const data = await getAllContent(filters);
      // Ensure data is always an array
      setContents(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load content');
      setContents([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedPaid]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const filteredContents = (Array.isArray(contents) ? contents : []).filter((c) => {
    // Search filter
    const matchesSearch = searchQuery
      ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // Subject filter
    const matchesSubject = selectedSubject ? c.subject === selectedSubject : true;

    return matchesSearch && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
          <p className="mt-2 text-gray-600">
            Browse educational resources and materials
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Content Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ContentType | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {Object.values(ContentType).map((type) => (
                <option key={type} value={type}>
                  {getContentTypeLabel(type)}
                </option>
              ))}
            </select>

            {/* Paid/Free Filter */}
            <select
              value={selectedPaid}
              onChange={(e) => setSelectedPaid(e.target.value as 'all' | 'paid' | 'free')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Content</option>
              <option value="free">Free Only</option>
              <option value="paid">Paid Only</option>
            </select>
          </div>

          {/* Subject Filter (Second Row) */}
          {uniqueSubjects.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSubject('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedSubject === ''
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Subjects
                </button>
                {uniqueSubjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedSubject === subject
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading content...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredContents.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No content found
            </h3>
            <p className="text-gray-600">
              {searchQuery || selectedType || selectedPaid !== 'all' || selectedSubject
                ? 'Try adjusting your filters'
                : 'No published content available yet'}
            </p>
          </div>
        )}

        {/* Content Grid */}
        {!loading && filteredContents.length > 0 && (
          <>
            {/* Results Count */}
            <div className="mb-4 text-gray-600">
              Showing {filteredContents.length} of {contents.length} results
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContents.map((content) => (
                <div
                  key={content.id}
                  onClick={() => router.push(`/content/${content.id}`)}
                  className="bg-white rounded-lg shadow hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
                >
                  {/* Thumbnail */}
                  <div className="h-48 bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                    {content.thumbnailUrl ? (
                      <Image
                        src={content.thumbnailUrl}
                        alt={content.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-6xl group-hover:scale-110 transition-transform">
                        {getContentTypeIcon(content.contentType)}
                      </div>
                    )}
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details →
                      </span>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {content.title}
                    </h3>

                    {/* Description */}
                    {content.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {content.description}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {getContentTypeLabel(content.contentType)}
                      </span>
                      {content.isPaid ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-semibold">
                          ${Number(content.price ?? 0).toFixed(2)}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                          Free
                        </span>
                      )}
                      {content.isDownloadable && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          📥 Downloadable
                        </span>
                      )}
                    </div>

                    {/* Subject & Grade */}
                    {(content.subject || content.grade) && (
                      <div className="flex gap-3 mb-4 text-sm text-gray-600">
                        {content.subject && <span>📚 {content.subject}</span>}
                        {content.grade && <span>🎓 {content.grade}</span>}
                      </div>
                    )}

                    {/* Teacher Info */}
                    {content.teacher && (
                      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                          {content.teacher.firstName[0]}{content.teacher.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {content.teacher.firstName} {content.teacher.lastName}
                          </p>
                          <p className="text-xs text-gray-500">Instructor</p>
                        </div>
                      </div>
                    )}

                    {/* Stats & Details */}
                    <div className="flex justify-between text-sm text-gray-600">
                      <div className="flex gap-3">
                        <span>👁️ {content.viewCount}</span>
                        {content.isDownloadable && (
                          <span>⬇️ {content.downloadCount}</span>
                        )}
                      </div>
                      <span className="text-xs">{formatFileSize(content.fileSize)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
