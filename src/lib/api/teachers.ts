// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Types
export interface TeacherUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  profilePicture?: string;
  role: string;
}

export interface TeacherProfile {
  id: string;
  teacherId: string;
  specialization?: string;
  qualifications?: string;
  yearsExperience?: number;
  rating?: number;
  ratingCount: number;
  verified: boolean;
  verifiedAt?: string;
  hourlyRate?: number;
  teachingLanguages?: string;
  subjects?: string;
  autoConfirmBookings: boolean;
  totalSessions: number;
  totalStudents: number;
  createdAt: string;
  updatedAt: string;
  teacher: TeacherUser;
}

export interface TeacherFilters {
  subject?: string;
  language?: string;
  minRating?: string;
}

// Helper
async function apiFetch(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}

/**
 * Get all verified teachers (Public)
 */
export async function getVerifiedTeachers(filters?: TeacherFilters): Promise<TeacherProfile[]> {
  const params = new URLSearchParams();
  if (filters?.subject) params.append('subject', filters.subject);
  if (filters?.language) params.append('language', filters.language);
  if (filters?.minRating) params.append('minRating', filters.minRating);

  const query = params.toString() ? `?${params}` : '';
  const data = await apiFetch(`/api/profiles/teachers/verified${query}`);
  return data.teachers;
}

/**
 * Get a teacher's public profile (Public)
 */
export async function getTeacherProfile(teacherId: string): Promise<TeacherProfile> {
  const data = await apiFetch(`/api/profiles/teacher/${teacherId}`);
  return data.profile;
}

/**
 * Get own teacher profile (Instructor only, authenticated)
 * Uses the public endpoint with own teacherId — requires user to know their ID.
 * Alternatively, use updateTeacherProfile with empty body to create if needed.
 */
export async function getMyTeacherProfile(): Promise<TeacherProfile> {
  const data = await apiFetch('/api/profiles/teacher/me');
  return data.profile;
}

/**
 * Update teacher profile (Instructor only)
 * PUT /api/profiles/teacher
 */
export async function updateTeacherProfile(data: {
  specialization?: string;
  qualifications?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  teachingLanguages?: string;
  subjects?: string;
  availabilityTimezone?: string;
  autoConfirmBookings?: boolean;
}): Promise<{ message: string; profile: TeacherProfile }> {
  return apiFetch('/api/profiles/teacher', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Get teacher's full display name
 */
export function getTeacherDisplayName(profile: TeacherProfile): string {
  return `${profile.teacher.firstName} ${profile.teacher.lastName}`;
}

/**
 * Parse comma-separated subjects into array
 */
export function parseSubjects(subjects?: string): string[] {
  if (!subjects) return [];
  return subjects.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Parse comma-separated languages into array
 */
export function parseLanguages(languages?: string): string[] {
  if (!languages) return [];
  return languages.split(',').map((l) => l.trim()).filter(Boolean);
}

/**
 * Format rating for display
 */
export function formatRating(rating?: number): string {
  if (rating == null || rating === 0) return 'New';
  return rating.toFixed(1);
}

