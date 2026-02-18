const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface LinkedStudent {
  linkId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  linkedSince: string;
}

export interface LinkedParent {
  linkId: string;
  parentId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  linkedSince: string;
}

export interface LinkRequest {
  id: string;
  parentName: string;
  parentEmail: string;
  message: string;
  createdAt: string;
}

export interface StudentProgress {
  studentId: string;
  enrollments: {
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
    progressPercentage: number;
    status: string;
    lastAccessedAt?: string;
    completedAt?: string;
  }[];
}

/**
 * Parent links with a student by email
 */
export async function linkStudent(studentEmail: string, message?: string) {
  const response = await fetch(`${API_BASE_URL}/api/parent/link-student`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ studentEmail, message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send link request');
  }

  return response.json();
}

/**
 * Get all linked students (parent view)
 */
export async function getMyStudents(): Promise<{ students: LinkedStudent[] }> {
  const response = await fetch(`${API_BASE_URL}/api/parent/my-students`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch linked students');
  }

  return response.json();
}

/**
 * Get all linked parents (student view)
 */
export async function getMyParents(): Promise<{ parents: LinkedParent[] }> {
  const response = await fetch(`${API_BASE_URL}/api/parent/my-parents`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch linked parents');
  }

  return response.json();
}

/**
 * Get pending link requests (student view)
 */
export async function getPendingRequests(): Promise<{ requests: LinkRequest[] }> {
  const response = await fetch(`${API_BASE_URL}/api/parent/pending-requests`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch pending requests');
  }

  return response.json();
}

/**
 * Student responds to a link request (accept/reject)
 */
export async function respondToLink(linkId: string, action: 'accept' | 'reject') {
  const response = await fetch(`${API_BASE_URL}/api/parent/respond-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ linkId, action }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to respond to link request');
  }

  return response.json();
}

/**
 * Unlink parent-student relationship
 */
export async function unlinkStudent(linkId: string) {
  const response = await fetch(`${API_BASE_URL}/api/parent/unlink/${linkId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unlink');
  }

  return response.json();
}

/**
 * Get specific student's progress (parent view)
 */
export async function getStudentProgress(studentId: string): Promise<StudentProgress> {
  const response = await fetch(`${API_BASE_URL}/api/parent/student/${studentId}/progress`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch student progress');
  }

  return response.json();
}
