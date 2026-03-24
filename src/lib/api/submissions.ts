const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

export interface SubmissionHistory {
    id: string;
    examId: string;
    studentId: string;
    attemptNumber: number;
    status: 'draft' | 'submitted' | 'graded' | 'returned';
    marksAwarded?: number;
    timeSpentMinutes?: number;
    submittedAt: string;
    metadata?: unknown;
}

export interface AnswerPayload {
    questionId: string;
    answerText?: string;
    uploadUrl?: string; // For handwritten answers
}

export interface SubmitExamPayload {
    answers: AnswerPayload[];
    timeSpentMinutes: number;
}

export const submissionApi = {
    getExamForStudent: async (examId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/submissions/exam/${examId}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            const err = await response.json();
            throw Object.assign(new Error(err.error || 'Failed'), { response: { status: response.status, data: err } });
        }
        const data = await response.json();
        return data.exam;
    },

    submitExam: async (examId: string, payload: SubmitExamPayload) => {
        const response = await fetch(`${API_BASE_URL}/api/submissions/exam/${examId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const err = await response.json();
            throw Object.assign(new Error(err.error || 'Failed'), { response: { status: response.status, data: err } });
        }
        const data = await response.json();
        return data;
    },

    getSubmissionHistory: async (examId: string): Promise<SubmissionHistory[]> => {
        const response = await fetch(`${API_BASE_URL}/api/submissions/exam/${examId}/history`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            const err = await response.json();
            throw Object.assign(new Error(err.error || 'Failed'), { response: { status: response.status, data: err } });
        }
        const data = await response.json();
        return data.history;
    },

    saveDraft: async (examId: string, answers: AnswerPayload[]) => {
        const response = await fetch(`${API_BASE_URL}/api/submissions/exam/${examId}/save-draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ answers })
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw Object.assign(new Error(err.error || 'Failed to save draft'), { response: { status: response.status, data: err } });
        }
        return await response.json();
    },

    uploadAnswerImage: async (examId: string, questionId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('contentType', 'image'); // Required by validation middleware

        const response = await fetch(`${API_BASE_URL}/api/exams/${examId}/questions/${questionId}/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw Object.assign(new Error(err.error || 'Failed to upload answer image'), { response: { status: response.status, data: err } });
        }
        return await response.json();
    }
};
