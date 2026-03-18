const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ========== Student Profile ==========

export interface StudentProfile {
  id: string;
  studentId: string;
  grade: string;
  medium: string;
  school?: string;
  dateOfBirth?: string;
  interests?: string;
  learningStyle?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStudentProfileData {
  grade?: string;
  medium?: string;
  school?: string;
  dateOfBirth?: string;
  interests?: string;
  learningStyle?: string;
  notes?: string;
}

export async function getMyStudentProfile(): Promise<StudentProfile | null> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  const { user } = await response.json();
  
  // Fetch student profile using the user ID
  const profileResponse = await fetch(`${API_BASE_URL}/api/profiles/student/${user.id}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (profileResponse.status === 404) {
    return null; // Profile not created yet
  }

  if (!profileResponse.ok) {
    const error = await profileResponse.json();
    throw new Error(error.error || 'Failed to fetch student profile');
  }

  const { profile } = await profileResponse.json();
  return profile;
}

export async function updateStudentProfile(data: UpdateStudentProfileData): Promise<StudentProfile> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/student`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update student profile');
  }

  const { profile } = await response.json();
  return profile;
}

// ========== Teacher Profile ==========

export interface TeacherProfile {
  id: string;
  teacherId: string;
  specialization?: string;
  qualifications?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  teachingLanguages?: string;
  subjects?: string;
  availabilityTimezone?: string;
  autoConfirmBookings: boolean;
  rating?: number;
  ratingCount: number;
  verified: boolean;
  verifiedAt?: string;
  totalSessions: number;
  totalStudents: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTeacherProfileData {
  specialization?: string;
  qualifications?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  teachingLanguages?: string;
  subjects?: string;
  availabilityTimezone?: string;
  autoConfirmBookings?: boolean;
}

export async function getMyTeacherProfile(): Promise<TeacherProfile | null> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  const { user } = await response.json();
  
  const profileResponse = await fetch(`${API_BASE_URL}/api/profiles/teacher/${user.id}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (profileResponse.status === 404) {
    return null;
  }

  if (!profileResponse.ok) {
    const error = await profileResponse.json();
    throw new Error(error.error || 'Failed to fetch teacher profile');
  }

  const data = await profileResponse.json();
  return data.profile ?? data;
}

export async function updateTeacherProfile(data: UpdateTeacherProfileData): Promise<TeacherProfile> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/teacher`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update teacher profile');
  }

  const { profile } = await response.json();
  return profile;
}

// ========== Parent Profile ==========

export interface ParentProfile {
  id: string;
  parentId: string;
  relationship?: string;
  occupation?: string;
  emergencyContact?: string;
  preferredLanguage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateParentProfileData {
  relationship?: string;
  occupation?: string;
  emergencyContact?: string;
  preferredLanguage?: string;
  notes?: string;
}

export async function getMyParentProfile(): Promise<ParentProfile | null> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/parent`, {
    method: 'GET',
    credentials: 'include',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch parent profile');
  }

  const { profile } = await response.json();
  return profile;
}

export async function updateParentProfile(data: UpdateParentProfileData): Promise<ParentProfile> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/parent`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update parent profile');
  }

  const { profile } = await response.json();
  return profile;
}

// ========== Constants ==========

export const GRADES = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'O/L', 'Grade 12', 'Grade 13', 'A/L',
];

export const MEDIUMS = ['English', 'Sinhala', 'Tamil'];

export const LEARNING_STYLES = ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing'];

export const TEACHING_LANGUAGES = ['English', 'Sinhala', 'Tamil'];

export const TIMEZONES = [
  { value: 'Asia/Colombo', label: 'Sri Lanka (GMT+5:30)' },
  { value: 'Asia/Kolkata', label: 'India (GMT+5:30)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
];

export const RELATIONSHIPS = ['Father', 'Mother', 'Guardian', 'Other'];

export const CONTACT_METHODS = ['Email', 'Phone', 'SMS', 'WhatsApp'];

