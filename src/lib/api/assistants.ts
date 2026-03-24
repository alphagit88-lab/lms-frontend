const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

export interface AssistantPermissions {
  manageSlots: boolean;
  manageBookings: boolean;
}

export interface Assistant {
  id: string; // Relationship ID
  assistantId: string; // User ID
  name: string;
  email: string;
  permissions: AssistantPermissions;
  createdAt: string;
}

export interface TeacherManaged {
  teacherId: string;
  name: string;
  email: string;
  permissions: AssistantPermissions;
}

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

// Teacher actions
export async function addAssistant(data: {
  assistantEmail: string;
  canManageSlots?: boolean;
  canManageBookings?: boolean;
}): Promise<{ message: string; assistant: Assistant }> {
  return apiFetch('/api/assistants/add', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyAssistants(): Promise<Assistant[]> {
  const data = await apiFetch('/api/assistants/my-assistants');
  return data.assistants;
}

export async function updateAssistantPermissions(
  relationshipId: string,
  permissions: Partial<AssistantPermissions>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ message: string; assistant: any }> {
  // Map frontend keys to backend keys
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const backendData: any = {};
  if (permissions.manageSlots !== undefined) backendData.canManageSlots = permissions.manageSlots;
  if (permissions.manageBookings !== undefined) backendData.canManageBookings = permissions.manageBookings;

  return apiFetch(`/api/assistants/${relationshipId}/permissions`, {
    method: 'PATCH',
    body: JSON.stringify(backendData),
  });
}

export async function removeAssistant(relationshipId: string): Promise<{ message: string }> {
  return apiFetch(`/api/assistants/${relationshipId}`, {
    method: 'DELETE',
  });
}

// Assistant actions
export async function getManagedTeachers(): Promise<TeacherManaged[]> {
  const data = await apiFetch('/api/assistants/my-teachers');
  return data.teachers;
}
