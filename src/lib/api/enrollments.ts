// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

import { Course, normalizeCourseUrls } from './courses';

export interface Enrollment {
    id: string;
    studentId: string;
    courseId: string;
    status: 'active' | 'completed' | 'dropped';
    progressPercentage: number;
    enrolledAt: string;
    completedAt?: string;
    lastAccessedAt?: string;
    course?: Course;
    student?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface EnrollmentProgress {
    totalLessons: number;
    completedLessons: number;
    percentComplete: number;
}

/**
 * Get all enrollments for the current student
 */
export async function getMyEnrollments(): Promise<Enrollment[]> {
    const response = await fetch(`${API_BASE_URL}/api/enrollments`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch your enrollments');
    }

    const data = await response.json();
    const enrollments = data.enrollments || (Array.isArray(data) ? data : []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return enrollments.map((e: any) => ({
        ...e,
        course: e.course ? normalizeCourseUrls(e.course) : e.course
    }));
}

/**
 * Get a single enrollment by ID
 */
export async function getEnrollmentById(id: string): Promise<Enrollment> {
    const response = await fetch(`${API_BASE_URL}/api/enrollments/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch enrollment');
    }

    const data = await response.json();
    const enrollment = data.enrollment || data;
    if (enrollment.course) {
        enrollment.course = normalizeCourseUrls(enrollment.course);
    }
    return enrollment;
}

/**
 * Enroll in a course
 */
export async function enrollInCourse(courseId: string): Promise<Enrollment> {
    const response = await fetch(`${API_BASE_URL}/api/enrollments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enroll in course');
    }

    const data = await response.json();
    const enrollment = data.enrollment || data;
    if (enrollment.course) {
        enrollment.course = normalizeCourseUrls(enrollment.course);
    }
    return enrollment;
}

/**
 * Unenroll from a course
 */
export async function unenrollFromCourse(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/enrollments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unenroll');
    }
}

/**
 * Get progress for an enrollment
 */
export async function getEnrollmentProgress(id: string): Promise<EnrollmentProgress> {
    const response = await fetch(`${API_BASE_URL}/api/enrollments/${id}/progress`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch progress');
    }

    return response.json();
}

export interface BulkEnrollResult {
    courseId: string;
    status: 'enrolled' | 'already_enrolled' | 'failed';
    message: string;
    enrollment?: Enrollment;
}

export interface BulkEnrollResponse {
    message: string;
    results: BulkEnrollResult[];
    summary: {
        enrolled: number;
        alreadyEnrolled: number;
        failed: number;
        total: number;
    };
}

/**
 * Bulk enroll in multiple courses
 */
export async function bulkEnrollInCourses(courseIds: string[]): Promise<BulkEnrollResponse> {
    const response = await fetch(`${API_BASE_URL}/api/enrollments/bulk`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseIds }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to bulk enroll');
    }

    return response.json();
}
