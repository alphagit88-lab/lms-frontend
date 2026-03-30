import { upload } from '@vercel/blob/client';

// API Configuration
const API_BASE_URL = typeof window !== "undefined" ? "/proxied-backend" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

// Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  bio?: string;
  profilePicture?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  instructorId: string;
  categoryId?: string;
  thumbnail?: string;
  previewVideoUrl?: string;
  status: 'draft' | 'published' | 'archived';
  level: 'beginner' | 'intermediate' | 'advanced';
  durationHours?: number;
  price: number;
  discountPercentage?: number;
  isPublished: boolean;
  publishedAt?: string;
  enrollmentCount: number;
  ratingAverage?: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  instructor?: Instructor;
  category?: Category;
  lessons?: Lesson[];
  exams?: Exam[];
  isEnrolled?: boolean;
  medium?: 'english' | 'sinhala' | 'tamil' | string;
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  slug?: string;
  description?: string;
  examType: 'quiz' | 'assignment' | 'test' | 'final_exam' | 'practice';
  totalQuestions: number;
  totalMarks: number;
  passingMarks?: number;
  passingScore?: number;
  durationMinutes?: number;
  duration?: number;
  isPublished: boolean;
  maxAttempts?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  content?: string;
  videoUrl?: string;
  durationMinutes: number;
  sortOrder: number;
  isPublished: boolean;
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFilters {
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  search?: string;
  instructor?: string;
  published?: boolean;
  medium?: string;
}

export interface CreateCourseData {
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  discountPercentage?: number;
  thumbnail?: string;
  previewVideoUrl?: string;
  medium?: 'english' | 'sinhala' | 'tamil' | string;
}

export interface UpdateCourseData {
  title?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  price?: number;
  discountPercentage?: number | null;
  thumbnail?: string;
  previewVideoUrl?: string;
  status?: 'draft' | 'published' | 'archived';
  isPublished?: boolean;
  medium?: 'english' | 'sinhala' | 'tamil' | string;
}

// API Functions

/**
 * Upload course media (thumbnail/preview)
 */
export async function uploadCourseMedia(file: File): Promise<{ url: string }> {
  const url = await uploadToBlob(file);
  return { url };
}

/**
 * Upload any file directly to Vercel Blob from the client.
 * This bypasses the 4.5MB Vercel serverless body size limit.
 */
export async function uploadToBlob(file: File): Promise<string> {
  const result = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: `${API_BASE_URL}/api/upload/blob`,
  });
  return result.url;
}

/**
 * Helper to ensure local file paths are absolute URLs
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeCourseUrls(course: any): any {
  if (!course) return course;
  const c = { ...course };
  if (c.thumbnail && c.thumbnail.startsWith('/uploads/')) {
    c.thumbnail = API_BASE_URL + c.thumbnail;
  }
  if (c.previewVideoUrl && c.previewVideoUrl.startsWith('/uploads/')) {
    c.previewVideoUrl = API_BASE_URL + c.previewVideoUrl;
  }
  // Also normalize instructor profile picture if it exists
  if (c.instructor && c.instructor.profilePicture && c.instructor.profilePicture.startsWith('/uploads/')) {
    c.instructor.profilePicture = API_BASE_URL + c.instructor.profilePicture;
  }
  return c;
}

/**
 * Delete course media
 */
export async function deleteCourseMedia(url: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/courses/delete-media`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to remove media');
  }
}

/**
 * Get all courses with optional filters
 */
export async function getCourses(filters?: CourseFilters): Promise<Course[]> {
  const params = new URLSearchParams();

  if (filters?.category) params.append('category', filters.category);
  if (filters?.level) params.append('level', filters.level);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.instructor) params.append('instructor', filters.instructor);
  if (filters?.published !== undefined) params.append('published', String(filters.published));
  if (filters?.medium) params.append('medium', filters.medium);

  const url = `${API_BASE_URL}/api/courses${params.toString() ? `?${params}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch courses');
  }

  const data = await response.json();
  return (data.courses || []).map(normalizeCourseUrls);
}

/**
 * Get a single course by ID
 */
export async function getCourseById(id: string): Promise<Course> {
  const response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch course');
  }

  const data = await response.json();
  // isEnrolled comes as a separate top-level field from the backend
  const normalizedCourse = normalizeCourseUrls(data.course);
  return { ...normalizedCourse, isEnrolled: data.isEnrolled ?? false };
}

/**
 * Get courses created by the current instructor
 */
export async function getMyCourses(): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/api/courses/my-courses`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch your courses');
  }

  const data = await response.json();
  return (data.courses || []).map(normalizeCourseUrls);
}

/**
 * Create a new course (Instructor/Admin only)
 */
export async function createCourse(courseData: CreateCourseData): Promise<Course> {
  const response = await fetch(`${API_BASE_URL}/api/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(courseData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create course');
  }

  const data = await response.json();
  return normalizeCourseUrls(data.course);
}

/**
 * Update an existing course (Instructor/Admin only)
 */
export async function updateCourse(id: string, courseData: UpdateCourseData): Promise<Course> {
  const response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(courseData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update course');
  }

  const data = await response.json();
  return normalizeCourseUrls(data.course);
}

/**
 * Delete a course (Instructor/Admin only)
 */
export async function deleteCourse(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete course');
  }
}

/**
 * Publish or unpublish a course (Instructor/Admin only)
 */
export async function togglePublishCourse(id: string, isPublished: boolean): Promise<Course> {
  const response = await fetch(`${API_BASE_URL}/api/courses/${id}/publish`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ isPublished }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to toggle publish status');
  }

  const data = await response.json();
  return data.course;
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch categories');
  }

  const data = await response.json();
  return data.categories;
}

/**
 * Create a new category
 */
export async function createCategory(data: { name: string; slug: string; description?: string; icon?: string; sortOrder?: number }): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create category');
  }

  const result = await response.json();
  return result.category;
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, data: { name: string; slug: string; description?: string; icon?: string; sortOrder?: number; isActive?: boolean }): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update category');
  }

  const result = await response.json();
  return result.category;
}

// ── Lesson API helpers ──────────────────────────────────────────────

export interface CreateLessonData {
  title: string;
  slug: string;
  content?: string;
  videoUrl?: string;
  videoFile?: File;
  durationMinutes?: number;
  isPreview?: boolean;
}

export interface UpdateLessonData {
  title?: string;
  slug?: string;
  content?: string;
  videoUrl?: string;
  videoFile?: File;
  durationMinutes?: number;
  isPreview?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
}

async function lessonApiFetch(endpoint: string, options?: RequestInit) {
  const headers: HeadersInit = { ...options?.headers };
  
  if (!(options?.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'An error occurred');
  return data;
}

export async function getLessonsForCourse(courseId: string): Promise<Lesson[]> {
  const data = await lessonApiFetch(`/api/lessons/courses/${courseId}/lessons`);
  return data.lessons;
}

export async function createLesson(courseId: string, lessonData: CreateLessonData): Promise<Lesson> {
  let body: BodyInit;
  if (lessonData.videoFile) {
    const formData = new FormData();
    formData.append("videoFile", lessonData.videoFile);
    formData.append("title", lessonData.title);
    formData.append("slug", lessonData.slug);
    if (lessonData.content) formData.append("content", lessonData.content);
    if (lessonData.videoUrl) formData.append("videoUrl", lessonData.videoUrl);
    if (lessonData.durationMinutes !== undefined) formData.append("durationMinutes", String(lessonData.durationMinutes));
    if (lessonData.isPreview !== undefined) formData.append("isPreview", String(lessonData.isPreview));
    body = formData;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { videoFile, ...rest } = lessonData;
    body = JSON.stringify(rest);
  }

  const data = await lessonApiFetch(`/api/lessons/courses/${courseId}/lessons`, {
    method: 'POST',
    body,
  });
  return data.lesson;
}

export async function updateLesson(id: string, lessonData: UpdateLessonData): Promise<Lesson> {
  let body: BodyInit;
  if (lessonData.videoFile) {
    const formData = new FormData();
    formData.append("videoFile", lessonData.videoFile);
    if (lessonData.title) formData.append("title", lessonData.title);
    if (lessonData.slug) formData.append("slug", lessonData.slug);
    if (lessonData.content) formData.append("content", lessonData.content);
    if (lessonData.videoUrl) formData.append("videoUrl", lessonData.videoUrl);
    if (lessonData.durationMinutes !== undefined) formData.append("durationMinutes", String(lessonData.durationMinutes));
    if (lessonData.isPreview !== undefined) formData.append("isPreview", String(lessonData.isPreview));
    if (lessonData.isPublished !== undefined) formData.append("isPublished", String(lessonData.isPublished));
    if (lessonData.sortOrder !== undefined) formData.append("sortOrder", String(lessonData.sortOrder));
    body = formData;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { videoFile, ...rest } = lessonData;
    body = JSON.stringify(rest);
  }

  const data = await lessonApiFetch(`/api/lessons/${id}`, {
    method: 'PUT',
    body,
  });
  return data.lesson;
}

export async function deleteLesson(id: string): Promise<void> {
  await lessonApiFetch(`/api/lessons/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderLessons(courseId: string, lessonIds: string[]): Promise<void> {
  await lessonApiFetch(`/api/lessons/courses/${courseId}/lessons/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ lessonIds }),
  });
}


