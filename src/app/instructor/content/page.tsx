'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  getAllContent,
  deleteContent,
  Content,
  ContentType,
  ContentFilters,
  formatFileSize,
  getContentTypeIcon,
  getContentTypeLabel,
} from '@/lib/api/content';
import AppLayout from '@/components/layout/AppLayout';

export default function InstructorContentPage() {
  const router = useRouter();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ContentType | ''>('');
  const [selectedPaid, setSelectedPaid] = useState<'all' | 'paid' | 'free'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Statistics
  const totalContent = contents.length;
  const totalViews = contents.reduce((sum, c) => sum + c.viewCount, 0);
  const totalDownloads = contents.reduce((sum, c) => sum + c.downloadCount, 0);
  const publishedContent = contents.filter((c) => c.isPublished).length;

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const filters: ContentFilters = {};
      if (selectedType) filters.contentType = selectedType;
      if (selectedPaid === 'paid') filters.isPaid = true;
      if (selectedPaid === 'free') filters.isPaid = false;

      const data = await getAllContent(filters);
      setContents(data);
      setError('');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedPaid]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      setDeletingId(id);
      await deleteContent(id);
      setContents(contents.filter((c) => c.id !== id));
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Failed to delete content');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredContents = searchQuery
    ? contents.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : contents;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Content Library</h1>
            <p className="mt-2 text-gray-600">
              Manage your educational content and resources
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Content</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{totalContent}</p>
                </div>
                <div className="text-4xl">📚</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">{publishedContent}</p>
                </div>
                <div className="text-4xl">✅</div>
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
                <div className="text-4xl">👁️</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Downloads</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {totalDownloads.toLocaleString()}
                  </p>
                </div>
                <div className="text-4xl">⬇️</div>
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

              {/* Upload Button */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                + Upload Content
              </button>
            </div>
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
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedType || selectedPaid !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by uploading your first educational resource'}
              </p>
              {!searchQuery && !selectedType && selectedPaid === 'all' && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload Your First Content
                </button>
              )}
            </div>
          )}

          {/* Content Grid */}
          {!loading && filteredContents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContents.map((content) => (
                <div
                  key={content.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="h-48 bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
                    {content.thumbnailUrl ? (
                      <Image
                        src={content.thumbnailUrl}
                        alt={content.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-6xl">{getContentTypeIcon(content.contentType)}</div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {content.title}
                    </h3>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {getContentTypeLabel(content.contentType)}
                      </span>
                      {content.isPaid ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          ${Number(content.price ?? 0).toFixed(2)}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          Free
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded ${content.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {content.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    {/* Subject & Grade */}
                    {(content.subject || content.grade) && (
                      <div className="flex gap-2 mb-4 text-sm text-gray-600">
                        {content.subject && <span>📚 {content.subject}</span>}
                        {content.grade && <span>🎓 {content.grade}</span>}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex justify-between text-sm text-gray-600 mb-4">
                      <span>👁️ {content.viewCount} views</span>
                      <span>⬇️ {content.downloadCount} downloads</span>
                    </div>

                    {/* File Info */}
                    <div className="text-xs text-gray-500 mb-4">
                      Size: {formatFileSize(content.fileSize)} • {content.language}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/instructor/content/${content.id}`)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/instructor/content/${content.id}/edit`)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(content.id)}
                        disabled={deletingId === content.id}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                      >
                        {deletingId === content.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Modal */}
          {showUploadModal && (
            <UploadModal
              onClose={() => setShowUploadModal(false)}
              onSuccess={() => {
                setShowUploadModal(false);
                fetchContent();
              }}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// Upload Modal Component
function UploadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: ContentType.PDF,
    language: 'English',
    isPaid: false,
    price: '',
    subject: '',
    grade: '',
    isDownloadable: true,
    isPublished: false,
    thumbnailUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (formData.title.length > 200) {
      setError('Title must be less than 200 characters');
      return;
    }

    if (formData.description.length > 10000) {
      setError('Description must be less than 10,000 characters');
      return;
    }

    if (formData.isPaid && !formData.price) {
      setError('Please enter a price for paid content');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setUploadProgress(0);

      const uploadData = {
        file,
        title: formData.title,
        description: formData.description || undefined,
        contentType: formData.contentType,
        language: formData.language,
        isPaid: formData.isPaid,
        price: formData.isPaid ? parseFloat(formData.price) : undefined,
        subject: formData.subject || undefined,
        grade: formData.grade || undefined,
        isDownloadable: formData.isDownloadable,
        isPublished: formData.isPublished,
        thumbnailUrl: formData.thumbnailUrl || undefined,
      };

      // Simulate progress (in real app, use XHR with progress events)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const { uploadContent } = await import('@/lib/api/content');
      await uploadContent(uploadData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to upload content');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Upload Content</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={uploading}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File *
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
            >
              {file ? (
                <div>
                  <p className="text-green-600 font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatFileSize(file.size)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-2">
                    Drag and drop your file here, or
                  </p>
                  <label className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                    browse
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.wav"
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title * (max 200 characters)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter content title"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (max 10,000 characters)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={10000}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your content..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/10,000 characters
            </p>
          </div>

          {/* Content Type & Language */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type *
              </label>
              <select
                value={formData.contentType}
                onChange={(e) =>
                  setFormData({ ...formData, contentType: e.target.value as ContentType })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.values(ContentType).map((type) => (
                  <option key={type} value={type}>
                    {getContentTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language *
              </label>
              <input
                type="text"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="English"
                required
              />
            </div>
          </div>

          {/* Subject & Grade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mathematics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade
              </label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Grade 10"
              />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) =>
                  setFormData({ ...formData, isPaid: e.target.checked, price: '' })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                This is paid content
              </span>
            </label>

            {formData.isPaid && (
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter price"
                required={formData.isPaid}
              />
            )}
          </div>

          {/* Thumbnail URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail URL (optional)
            </label>
            <input
              type="url"
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/thumbnail.jpg"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isDownloadable}
                onChange={(e) =>
                  setFormData({ ...formData, isDownloadable: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Allow downloads</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData({ ...formData, isPublished: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Publish immediately</span>
            </label>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
