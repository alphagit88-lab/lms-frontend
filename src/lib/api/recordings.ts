// API Configuration
const API_BASE_URL = typeof window !== "undefined" ? "/proxied-backend" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

// Types
export interface Recording {
  id: string;
  sessionId: string;
  fileUrl: string;
  fileSize?: number;
  durationMinutes?: number;
  videoQuality?: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  isProcessed: boolean;
  isPublic: boolean;
  viewCount: number;
  uploadedAt: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  session?: {
    id: string;
    classId: string;
    title: string;
    startTime: string;
    endTime: string;
    class?: {
      id: string;
      name: string;
      teacherId: string;
    };
  };
}

export interface CreateRecordingData {
  sessionId?: string;   // optional — standalone recordings don't require a session
  fileUrl: string;
  fileSize?: number;
  durationMinutes?: number;
  videoQuality?: string;
  thumbnailUrl?: string;
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateRecordingData {
  fileUrl?: string;
  durationMinutes?: number;
  videoQuality?: string;
  thumbnailUrl?: string;
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}

export interface RecordingFilters {
  sessionId?: string;
  classId?: string;
  isPublic?: boolean;
  teacherId?: string;
}

// API Functions

/**
 * Get all recordings with optional filters
 */
export async function getAllRecordings(filters?: RecordingFilters): Promise<Recording[]> {
  const params = new URLSearchParams();
  if (filters?.sessionId) params.append('sessionId', filters.sessionId);
  if (filters?.classId) params.append('classId', filters.classId);
  if (filters?.isPublic !== undefined) params.append('isPublic', String(filters.isPublic));
  if (filters?.teacherId) params.append('teacherId', filters.teacherId);

  const url = `${API_BASE_URL}/api/recordings${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch recordings');
  }

  const data = await response.json();
  return data.recordings;
}

/**
 * Get a single recording by ID
 */
export async function getRecordingById(id: string): Promise<Recording> {
  const response = await fetch(`${API_BASE_URL}/api/recordings/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch recording');
  }

  const data = await response.json();
  return data.recording;
}

/**
 * Create a new recording (Instructor/Admin only)
 */
export async function createRecording(data: CreateRecordingData | FormData): Promise<Recording> {
  const isFormData = data instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/recordings`, {
    method: 'POST',
    headers: isFormData ? undefined : {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: isFormData ? data : JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create recording');
  }

  const result = await response.json();
  return result.recording;
}

/**
 * Update a recording (Instructor/Admin only)
 */
export async function updateRecording(id: string, data: UpdateRecordingData | FormData): Promise<Recording> {
  const isFormData = data instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/recordings/${id}`, {
    method: 'PUT',
    headers: isFormData ? undefined : {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: isFormData ? data : JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update recording');
  }

  const result = await response.json();
  return result.recording;
}

/**
 * Delete a recording (Instructor/Admin only)
 */
export async function deleteRecording(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/recordings/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete recording');
  }
}

// Helper Functions

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format duration in minutes to HH:MM:SS
 */
export function formatDuration(minutes?: number): string {
  if (!minutes) return '00:00';
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.floor((minutes % 1) * 60);
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

/**
 * Get quality badge color
 */
export function getQualityBadgeColor(quality?: string): string {
  if (!quality) return 'bg-gray-100 text-gray-800';
  if (quality.includes('1080') || quality.includes('HD')) return 'bg-green-100 text-green-800';
  if (quality.includes('720')) return 'bg-blue-100 text-blue-800';
  if (quality.includes('480')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
}
