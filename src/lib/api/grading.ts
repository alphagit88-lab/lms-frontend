const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Types
export interface GradingSubmission {
    id: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    attemptNumber: number;
    status: 'draft' | 'submitted' | 'graded' | 'returned';
    marksAwarded?: number;
    timeSpentMinutes?: number;
    submittedAt: string;
    feedback?: string;
    answers: GradingAnswer[];
}

export interface GradingAnswer {
    id: string;
    questionId: string;
    answerText?: string;
    uploadUrl?: string;
    ocrText?: string;
    marksAwarded?: number;
    status: string;
    feedback?: string;
}

export interface GradingExamInfo {
    id: string;
    title: string;
    totalMarks: number;
    passingMarks?: number;
    questions: Array<{
        id: string;
        questionText: string;
        questionType: string;
        marks: number;
        orderIndex: number;
        options?: Array<{
            id: string;
            optionText: string;
            isCorrect: boolean;
        }>;
    }>;
}

export interface StudentResult {
    id: string;
    attemptNumber: number;
    status: string;
    totalMarksAwarded?: number;
    feedback?: string;
    submittedAt: string;
    gradedAt?: string;
    answers: Array<{
        questionId: string;
        answerText?: string;
        uploadUrl?: string;
        marksAwarded?: number;
        feedback?: string;
        status: string;
    }>;
}

const fetchJSON = async (url: string, options: RequestInit = {}) => {
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
        throw Object.assign(
            new Error(err.error || 'Request failed'),
            { response: { status: res.status, data: err } }
        );
    }
    if (res.status === 204) return null;
    return await res.json();
};

export const gradingApi = {
    // Get all submissions for an exam
    getSubmissions: async (examId: string): Promise<{ exam: GradingExamInfo; submissions: GradingSubmission[] }> => {
        return await fetchJSON(`/api/grading/exam/${examId}/submissions`);
    },

    // Grade a specific answer
    gradeAnswer: async (submissionId: string, marksAwarded: number, feedback?: string) => {
        return await fetchJSON(`/api/grading/submissions/${submissionId}/grade`, {
            method: 'PUT',
            body: JSON.stringify({ marksAwarded, feedback })
        });
    },

    // Finalize grading for a master submission
    finalizeGrading: async (submissionId: string, overallFeedback?: string) => {
        return await fetchJSON(`/api/grading/submissions/${submissionId}/finalize`, {
            method: 'PUT',
            body: JSON.stringify({ overallFeedback })
        });
    },

    // Publish scores
    publishScores: async (examId: string) => {
        return await fetchJSON(`/api/grading/exam/${examId}/publish-scores`, {
            method: 'PATCH'
        });
    },

    // Get my result (student)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getMyResult: async (examId: string): Promise<{ exam: any; results: StudentResult[] }> => {
        return await fetchJSON(`/api/grading/exam/${examId}/my-result`);
    },

    // Trigger OCR on a submission
    triggerOCR: async (submissionId: string) => {
        return await fetchJSON(`/api/grading/submissions/${submissionId}/ocr`, {
            method: 'POST'
        });
    },

    // Get PDF download URL
    getPDFUrl: (submissionId: string) => {
        return `${API_BASE_URL}/api/grading/submissions/${submissionId}/pdf`;
    }
};
