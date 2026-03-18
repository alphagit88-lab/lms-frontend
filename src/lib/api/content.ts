// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Types
export enum ContentType {
  PDF = 'pdf',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  PRESENTATION = 'presentation',
  WORKSHEET = 'worksheet',
  QUIZ = 'quiz',
  OTHER = 'other',
}

export interface Content {
  id: string;
  teacherId: string;
  contentType: ContentType;
  title: string;
  description?: string;
  language: string;
  fileUrl: string;
  fileSize?: number;
  thumbnailUrl?: string;
  isPaid: boolean;
  price?: number | string;  // TypeORM decimal columns are returned as strings at runtime
  isPublished: boolean;
  isDownloadable: boolean;
  downloadCount: number;
  viewCount: number;
  subject?: string;
  grade?: string;
  createdAt: string;
  updatedAt: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface UploadContentData {
  file: File;
  title: string;
  description?: string;
  contentType: ContentType;
  language: string;
  isPaid: boolean;
  price?: number;
  subject?: string;
  grade?: string;
  isDownloadable: boolean;
  isPublished: boolean;
  thumbnailUrl?: string;
}

export interface UpdateContentData {
  title?: string;
  description?: string;
  language?: string;
  isPaid?: boolean;
  price?: number;
  subject?: string;
  grade?: string;
  isDownloadable?: boolean;
  isPublished?: boolean;
  thumbnailUrl?: string;
}

export interface ContentFilters {
  contentType?: ContentType;
  subject?: string;
  isPaid?: boolean;
  isPublished?: boolean;
  teacherId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ContentAccessResponse {
  hasAccess: boolean;
  reason: string;
  canDownload: boolean;
  price?: number | string;
  teacherId?: string;
}

/**
 * Upload new content
 */
export async function uploadContent(data: UploadContentData): Promise<Content> {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  formData.append('contentType', data.contentType);
  formData.append('language', data.language);
  formData.append('isPaid', String(data.isPaid));
  if (data.price) formData.append('price', String(data.price));
  if (data.subject) formData.append('subject', data.subject);
  if (data.grade) formData.append('grade', data.grade);
  formData.append('isDownloadable', String(data.isDownloadable));
  formData.append('isPublished', String(data.isPublished));
  if (data.thumbnailUrl) formData.append('thumbnailUrl', data.thumbnailUrl);

  const response = await fetch(`${API_BASE_URL}/api/content/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload content');
  }

  return response.json();
}

/**
 * Get all content with optional filters
 */
export async function getAllContent(filters?: ContentFilters): Promise<Content[]> {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.contentType) params.append('contentType', filters.contentType);
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.isPaid !== undefined) params.append('isPaid', String(filters.isPaid));
    if (filters.isPublished !== undefined) params.append('isPublished', String(filters.isPublished));
    if (filters.teacherId) params.append('teacherId', filters.teacherId);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
  }

  const url = `${API_BASE_URL}/api/content${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch content');
  }

  // Backend returns { contents: Content[], pagination: {...} } — extract the array
  const data = await response.json();
  return Array.isArray(data) ? data : (data.contents ?? []);
}

/**
 * Get content by ID
 */
export async function getContentById(id: string): Promise<Content> {
  const response = await fetch(`${API_BASE_URL}/api/content/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch content');
  }

  return response.json();
}

/**
 * Check content access
 */
export async function checkContentAccess(id: string): Promise<ContentAccessResponse> {
  const response = await fetch(`${API_BASE_URL}/api/content/${id}/access`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to check access');
  }

  return response.json();
}

/**
 * Get the streaming URL for video/audio content (used in <video src="...">).
 * The browser sends Range headers automatically; the backend handles HTTP 206.
 */
export function getContentStreamUrl(id: string): string {
  return `${API_BASE_URL}/api/content/${id}/stream`;
}

/**
 * Download content
 */
export async function downloadContent(id: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/content/${id}/download`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to download content');
  }

  return response.blob();
}

/**
 * Increment view count
 */
export async function incrementViewCount(id: string): Promise<{ viewCount: number }> {
  const response = await fetch(`${API_BASE_URL}/api/content/${id}/view`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to increment view count');
  }

  return response.json();
}

/**
 * Update content
 */
export async function updateContent(id: string, data: UpdateContentData): Promise<Content> {
  const response = await fetch(`${API_BASE_URL}/api/content/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update content');
  }

  return response.json();
}

/**
 * Delete content
 */
export async function deleteContent(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/content/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete content');
  }
}

/**
 * Helper: Format file size
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Helper: Get content type icon
 */
export function getContentTypeIcon(contentType: ContentType): string {
  const icons: Record<ContentType, string> = {
    [ContentType.VIDEO]: '🎥',
    [ContentType.PDF]: '📄',
    [ContentType.AUDIO]: '🎵',
    [ContentType.DOCUMENT]: '📃',
    [ContentType.PRESENTATION]: '📊',
    [ContentType.WORKSHEET]: '📝',
    [ContentType.QUIZ]: '❓',
    [ContentType.OTHER]: '📎',
  };
  return icons[contentType] || '📎';
}

/**
 * Helper: Get content type label
 */
export function getContentTypeLabel(contentType: ContentType): string {
  const labels: Record<ContentType, string> = {
    [ContentType.VIDEO]: 'Video',
    [ContentType.PDF]: 'PDF Document',
    [ContentType.AUDIO]: 'Audio',
    [ContentType.DOCUMENT]: 'Document',
    [ContentType.PRESENTATION]: 'Presentation',
    [ContentType.WORKSHEET]: 'Worksheet',
    [ContentType.QUIZ]: 'Quiz',
    [ContentType.OTHER]: 'Other',
  };
  return labels[contentType] || 'Unknown';
}
