'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  getContentById,
  updateContent,
  ContentType,
  getContentTypeLabel,
  Content,
  UpdateContentData
} from '@/lib/api/content';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<UpdateContentData>({
    title: '',
    description: '',
    contentType: undefined,
    language: '',
    isPaid: false,
    price: '',
    subject: '',
    grade: '',
    isDownloadable: true,
    isPublished: false,
    thumbnailUrl: '',
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const data = await getContentById(id);
        setContent(data);
        setFormData({
          title: data.title,
          description: data.description || '',
          language: data.language,
          isPaid: data.isPaid,
          price: data.price ? String(data.price) : '',
          subject: data.subject || '',
          grade: data.grade || '',
          isDownloadable: data.isDownloadable,
          isPublished: data.isPublished,
          thumbnailUrl: data.thumbnailUrl || '',
        });
      } catch (err) {
        setError((err as Error).message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      const updateData: UpdateContentData = {
        ...formData,
        price: formData.isPaid ? parseFloat(String(formData.price)) : undefined,
      };

      await updateContent(id, updateData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/instructor/content');
      }, 1500);
    } catch (err) {
      setError((err as Error).message || 'Failed to update content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <AppLayout>
        <div className="max-w-3xl mx-auto py-8 px-4">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Edit Content</h1>
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                Content updated successfully! Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Subject & Grade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Grade 10"
                  />
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Pricing */}
              <div>
                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">This is paid content</span>
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
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>

              {/* Options */}
              <div className="space-y-4 pt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isDownloadable}
                    onChange={(e) => setFormData({ ...formData, isDownloadable: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Allow downloads</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Published</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
