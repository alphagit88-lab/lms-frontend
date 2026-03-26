// API Configuration
const API_BASE_URL = typeof window !== "undefined" ? "/proxied-backend" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'parent' | 'admin';
  bio: string | null;
  profilePicture: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'student' | 'instructor' | 'parent' | 'admin';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
}

class AuthAPI {
  private async fetch(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      cache: 'no-store',
      credentials: 'include', // Important: send cookies with requests
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

  async register(data: RegisterData): Promise<AuthResponse> {
    return this.fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginData): Promise<AuthResponse> {
    return this.fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.fetch('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.fetch('/api/auth/me');
  }

  async getStatus(): Promise<AuthStatus> {
    return this.fetch('/api/auth/status');
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    profilePicture?: string;
  }): Promise<{ message: string; user: User }> {
    return this.fetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return this.fetch('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    return this.fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(data: {
    email: string;
    token: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return this.fetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadProfilePicture(file: File): Promise<{ message: string; user: User }> {
    const formData = new FormData();
    formData.append('profilePicture', file);

    // Don't use this.fetch() because it sets Content-Type to JSON.
    // For multipart/form-data the browser must set the boundary itself.
    const response = await fetch(`${API_BASE_URL}/api/auth/profile-picture`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload profile picture');
    }
    return data;
  }

  async deleteProfilePicture(): Promise<{ message: string; user: User }> {
    return this.fetch('/api/auth/profile-picture', {
      method: 'DELETE',
    });
  }
}

export const authAPI = new AuthAPI();
