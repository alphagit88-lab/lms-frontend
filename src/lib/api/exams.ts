const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface QuestionOption {
    id: string;
    optionText: string;
    isCorrect: boolean;
    orderIndex: number;
}

export interface Question {
    id: string;
    examId: string;
    questionText: string;
    questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    marks: number;
    orderIndex: number;
    options?: QuestionOption[];
}

export interface Exam {
    id: string;
    courseId: string;
    title: string;
    description?: string;
    examType: 'quiz' | 'assignment' | 'test' | 'final_exam' | 'practice';
    examDate?: string;
    durationMinutes?: number;
    totalMarks: number;
    passingMarks?: number;
    language?: string;
    isPublished: boolean;
    allowLateSubmission: boolean;
    maxAttempts: number;
    showCorrectAnswers: boolean;
    createdAt: string;
    questions?: Question[];
    course?: {
        title: string;
    };
}

export interface CreateExamPayload {
    courseId: string;
    title: string;
    description?: string;
    examType: string;
    language?: string;
    durationMinutes?: number;
    totalMarks: number;
    passingMarks?: number;
    examDate?: string;
    allowLateSubmission?: boolean;
    maxAttempts?: number;
}

export interface CreateQuestionPayload {
    questionText: string;
    questionType: string;
    marks: number;
    orderIndex: number;
    options?: {
        optionText: string;
        isCorrect: boolean;
        orderIndex?: number;
    }[];
}

const fetchWithData = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Object.assign(new Error(err.error || 'Request failed'), { response: { status: res.status, data: err } });
    }
    if (res.status === 204) return null;
    return await res.json();
};

export const examApi = {
    // Exam CRUD
    createExam: async (payload: CreateExamPayload): Promise<Exam> => {
        const data = await fetchWithData('/api/exams', { method: 'POST', body: JSON.stringify(payload) });
        return data.exam;
    },

    getExamsForCourse: async (courseId: string): Promise<Exam[]> => {
        const data = await fetchWithData(`/api/exams/course/${courseId}`);
        return data.exams;
    },

    getMyExams: async (): Promise<Exam[]> => {
        const data = await fetchWithData(`/api/exams/my-exams`);
        return data.exams;
    },

    getExamById: async (id: string): Promise<Exam> => {
        const data = await fetchWithData(`/api/exams/${id}`);
        return data.exam;
    },

    updateExam: async (id: string, payload: Partial<CreateExamPayload>): Promise<Exam> => {
        const data = await fetchWithData(`/api/exams/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        return data.exam;
    },

    deleteExam: async (id: string): Promise<void> => {
        await fetchWithData(`/api/exams/${id}`, { method: 'DELETE' });
    },

    publishExam: async (id: string): Promise<Exam> => {
        const data = await fetchWithData(`/api/exams/${id}/publish`, { method: 'PATCH' });
        return data.exam;
    },

    // Question CRUD
    createQuestion: async (examId: string, payload: CreateQuestionPayload): Promise<Question> => {
        const data = await fetchWithData(`/api/exams/${examId}/questions`, { method: 'POST', body: JSON.stringify(payload) });
        return data.question;
    },

    getQuestionsForExam: async (examId: string): Promise<Question[]> => {
        const data = await fetchWithData(`/api/exams/${examId}/questions`);
        return data.questions;
    },

    updateQuestion: async (id: string, payload: Partial<CreateQuestionPayload>): Promise<Question> => {
        const data = await fetchWithData(`/api/questions/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        return data.question;
    },

    deleteQuestion: async (id: string): Promise<void> => {
        await fetchWithData(`/api/questions/${id}`, { method: 'DELETE' });
    },
};
