const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type NotificationType =
  | 'booking_reminder'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_success'
  | 'payment_failed'
  | 'exam_scheduled'
  | 'grade_posted'
  | 'message_received'
  | 'course_enrolled'
  | 'session_started'
  | 'general';

export interface NotificationItem {
  id: string;
  userId: string;
  channel: NotificationChannel;
  notificationType: NotificationType;
  title?: string;
  message: string;
  actionUrl?: string;
  referenceId?: string;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
  deliveryStatus?: string;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  pagination: PaginationMeta;
}

class NotificationAPI {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
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

    return data as T;
  }

  async getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<NotificationsResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(unreadOnly ? { unreadOnly: 'true' } : {}),
    });
    return this.fetch<NotificationsResponse>(`/api/notifications?${params}`);
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return this.fetch<{ count: number }>('/api/notifications/unread-count');
  }

  async markRead(id: string): Promise<{ message: string }> {
    return this.fetch<{ message: string }>(`/api/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllRead(): Promise<{ message: string }> {
    return this.fetch<{ message: string }>('/api/notifications/read-all', { method: 'PATCH' });
  }

  async deleteNotification(id: string): Promise<{ message: string }> {
    return this.fetch<{ message: string }>(`/api/notifications/${id}`, { method: 'DELETE' });
  }
}

export const notificationAPI = new NotificationAPI();
