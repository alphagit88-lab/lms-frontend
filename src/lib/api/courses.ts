// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
  isEnrolled?: boolean;
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
}

export interface CreateCourseData {
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  thumbnail?: string;
  previewVideoUrl?: string;
}

export interface UpdateCourseData {
  title?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  price?: number;
  thumbnail?: string;
  previewVideoUrl?: string;
  status?: 'draft' | 'published' | 'archived';
  isPublished?: boolean;
}

// API Functions

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
  return data.courses;
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
  return data.course;
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
  return data.courses;
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
  return data.course;
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
  return data.course;
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
