const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || 'An error occurred');
    return data as T;
}

// ─── Types ──────────────────────────────────────────────────────

export interface StudentProgressRow {
    enrollmentId: string;
    studentId: string;
    name: string;
    email: string;
    courseId: string;
    courseTitle: string;
    progress: number;
    lastActive: string | null;
    enrolledAt: string;
    enrollmentStatus: string;
    totalLessons: number;
    completedLessons: number;
    avgExamScore: number | null;
    examCount: number;
}

export interface TeacherStudentsResponse {
    students: StudentProgressRow[];
    total: number;
}

export interface ExamRecord {
    submissionId: string;
    examId: string;
    examTitle: string;
    examType: string;
    courseId: string;
    courseTitle: string;
    marksAwarded: number;
    totalMarks: number;
    scorePercent: number;
    passed: boolean | null;
    submittedAt: string;
    gradedAt: string | null;
    timeSpentMinutes: number | null;
    attemptNumber: number;
}

export interface StudentExamsResponse {
    exams: ExamRecord[];
    averageScore: number;
    trend: 'improving' | 'declining' | 'stable';
    total: number;
}

export interface AttendanceRow {
    studentId: string;
    name: string;
    email: string;
    sessionsAttended: number;
    noShows: number;
    totalScheduled: number;
    attendanceRate: number;
}

export interface AttendanceResponse {
    students: AttendanceRow[];
    overallAttendanceRate: number;
    total: number;
}

export interface TimelineEvent {
    type: 'enrollment' | 'lesson_completed' | 'exam_graded';
    title: string;
    subtitle?: string;
    referenceId: string;
    eventDate: string;
    meta?: Record<string, unknown>;
}

export interface TeacherSummary {
    totalEarnings: number;
    thisMonthEarnings: number;
    pendingPayout: number;
    rating: number | null;
    ratingCount: number;
    totalStudents: number;
    totalSessions: number;
}

export interface EarningsDataPoint {
    label: string;
    earnings: number;
    transactions: number;
}

export interface CoursePerformance {
    courseId: string;
    courseTitle: string;
    totalEnrolled: number;
    completionRate: number;
    averageScore: number;
    topPerformers: Array<{ studentId: string; name: string; avgScore: number; examsTaken: number }>;
    needsAttention: Array<{ studentId: string; name: string; avgScore: number; examsTaken: number }>;
    lessonEngagement: Array<{
        lessonId: string;
        lessonTitle: string;
        sortOrder: number;
        studentsStarted: number;
        studentsCompleted: number;
        completionRate: number;
    }>;
}

export interface AdminSummary {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalAdmins: number;
    totalCourses: number;
    publishedCourses: number;
    totalRevenue: number;
    totalCommission: number;
    totalRefunds: number;
    activeSessionsToday: number;
    newUsersThisMonth: number;
}

export interface RevenueDataPoint {
    label: string;
    period: string;
    grossRevenue: number;
    netRevenue: number;
    commission: number;
    refunds: number;
    payouts: number;
}

export interface AdminTeacherRow {
    id: string;
    name: string;
    email: string;
    lastActive: string | null;
    isActive: boolean;
    rating: number | null;
    ratingCount: number;
    verified: boolean;
    coursesCreated: number;
    sessionsConducted: number;
    totalEarnings: number;
}

// ─── API Functions ───────────────────────────────────────────────

/** 7.1 — Teacher: student progress list */
export const getTeacherStudents = (courseId?: string) =>
    apiFetch<TeacherStudentsResponse>(
        `/api/analytics/teacher/students${courseId ? `?courseId=${courseId}` : ''}`
    );

/** 7.2 — Student: own exam history */
export const getStudentExams = () =>
    apiFetch<StudentExamsResponse>('/api/analytics/student/exams');

/** 7.3 — Teacher: attendance tracking */
export const getTeacherAttendance = (courseId?: string) =>
    apiFetch<AttendanceResponse>(
        `/api/analytics/teacher/attendance${courseId ? `?courseId=${courseId}` : ''}`
    );

/** 7.4 — Student: learning timeline */
export const getStudentTimeline = () =>
    apiFetch<{ events: TimelineEvent[]; total: number }>('/api/analytics/student/timeline');

/** 7.5 — Teacher: earnings summary */
export const getTeacherSummary = () =>
    apiFetch<TeacherSummary>('/api/analytics/teacher/summary');

/** 7.5 — Teacher: earnings chart */
export const getTeacherEarningsChart = (period: 'monthly' | 'weekly' = 'monthly') =>
    apiFetch<{ data: EarningsDataPoint[]; period: string }>(
        `/api/analytics/teacher/earnings?period=${period}`
    );

/** 7.6 — Teacher: course performance */
export const getCoursePerformance = (courseId: string) =>
    apiFetch<CoursePerformance>(`/api/analytics/teacher/course/${courseId}/performance`);

/** 7.7 — Admin: platform summary */
export const getAdminSummary = () =>
    apiFetch<AdminSummary>('/api/analytics/admin/summary');

/** 7.8 — Admin: revenue chart */
export const getAdminRevenue = (period: 'monthly' | 'weekly' = 'monthly') =>
    apiFetch<{ data: RevenueDataPoint[]; period: string }>(
        `/api/analytics/admin/revenue?period=${period}`
    );

/** 7.9 — Admin: teacher activity */
export const getAdminTeachers = () =>
    apiFetch<{ teachers: AdminTeacherRow[]; total: number }>('/api/analytics/admin/teachers');
