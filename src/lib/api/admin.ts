const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

/* ── Types ─────────────────────────────────────────── */

export interface PlatformStats {
    totalUsers: number;
    students: number;
    instructors: number;
    parents: number;
    admins: number;
    totalCourses: number;
    totalBookings: number;
    pendingTeachers: number;
    recentSignups: number;
}

export interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    profilePicture: string | null;
    bio: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UsersResponse {
    users: AdminUser[];
    total: number;
    page: number;
    totalPages: number;
}

export interface PendingTeacher {
    id: string;
    teacherId: string;
    verified: boolean;
    bio: string | null;
    qualifications: string | null;
    specializations: string[];
    hourlyRate: number | null;
    createdAt: string;
    teacher: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

/* ── API Functions ─────────────────────────────────── */

export async function getStats(): Promise<PlatformStats> {
    return apiFetch('/api/admin/stats');
}

export async function getUsers(params?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<UsersResponse> {
    const qs = new URLSearchParams();
    if (params?.role) qs.set('role', params.role);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiFetch(`/api/admin/users${query ? `?${query}` : ''}`);
}

export async function toggleUserActive(userId: string): Promise<{ message: string; user: AdminUser }> {
    return apiFetch(`/api/admin/users/${userId}/toggle-active`, { method: 'PATCH' });
}

export async function deleteUser(userId: string): Promise<{ message: string }> {
    return apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
}

export async function getPendingTeachers(): Promise<{ teachers: PendingTeacher[] }> {
    return apiFetch('/api/admin/teachers/pending');
}

export async function verifyTeacher(teacherId: string): Promise<{ message: string }> {
    return apiFetch(`/api/admin/teachers/${teacherId}/verify`, { method: 'PATCH' });
}

export async function rejectTeacher(teacherId: string, reason?: string): Promise<{ message: string }> {
    return apiFetch(`/api/admin/teachers/${teacherId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
    });
}
