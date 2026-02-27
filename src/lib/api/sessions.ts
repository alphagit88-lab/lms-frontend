const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface CreateSessionPayload {
    title: string;
    startTime: string;  // ISO 8601
    endTime: string;    // ISO 8601
    classId?: string;
    description?: string;
    sessionType?: 'live' | 'recorded' | 'hybrid';
    createZoomMeeting?: boolean;
}

export interface Session {
    id: string;
    classId?: string;
    bookingId?: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    sessionType: 'live' | 'recorded' | 'hybrid';
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    meetingLink?: string;
    meetingId?: string;
    meetingPassword?: string;
    isRecorded: boolean;
    attendanceCount: number;
}

class SessionAPI {
    private async fetch(endpoint: string, options?: RequestInit) {
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

    async getUpcomingSessions(): Promise<Session[]> {
        const data = await this.fetch('/api/sessions/upcoming');
        return data.sessions;
    }

    async getSessionById(id: string): Promise<Session> {
        const data = await this.fetch(`/api/sessions/${id}`);
        return data.session;
    }

    async startSession(id: string): Promise<Session> {
        const data = await this.fetch(`/api/sessions/${id}/start`, {
            method: 'PATCH',
        });
        return data.session;
    }

    async endSession(id: string): Promise<Session> {
        const data = await this.fetch(`/api/sessions/${id}/end`, {
            method: 'PATCH',
        });
        return data.session;
    }

    async createSession(payload: CreateSessionPayload): Promise<Session> {
        const data = await this.fetch('/api/sessions', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return data.session;
    }

    async cancelSession(id: string): Promise<void> {
        await this.fetch(`/api/sessions/${id}`, {
            method: 'DELETE',
        });
    }
}

export const sessionApi = new SessionAPI();
