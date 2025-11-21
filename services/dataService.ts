import { MemoryEntry, Companion, ChronicleEvent, User, ImageFile, AdminDashboardStats, UserActivityStat, UserShareActivity } from '../types';
import { USER_ROLES } from '../constants';

const API_BASE = '/api';

// Helper for API calls
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'API request failed');
  }
  return response.json();
}

// Memories
export const fetchMemoriesForUser = async (userId: string): Promise<MemoryEntry[]> => {
  return fetchApi<MemoryEntry[]>(`/memories/user/${userId}`);
};

export const fetchAllPublicMemories = async (): Promise<MemoryEntry[]> => {
  // Not implemented in backend yet, using user memories for now or need new endpoint
  // For now, let's assume we filter on frontend or add endpoint later if needed.
  // Actually, let's just return empty or implement properly. 
  // The backend 'user' endpoint handles shared memories, but 'public' is different.
  // Let's skip for this iteration or use a simple fetch.
  return [];
};

export const addMemoryForUser = async (userId: string, memoryData: Omit<MemoryEntry, 'id' | 'userId' | 'createdAt' | 'geminiPondering' | 'sharedWith'>, geminiPondering: string): Promise<MemoryEntry> => {
  return fetchApi<MemoryEntry>('/memories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...memoryData, userId, geminiPondering })
  });
};

export const updateMemoryForUser = async (userId: string, memoryUpdate: MemoryEntry): Promise<MemoryEntry> => {
  return fetchApi<MemoryEntry>(`/memories/${memoryUpdate.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memoryUpdate)
  });
};

export const deleteMemoryForUser = async (ownerUserId: string, memoryId: string): Promise<void> => {
  await fetchApi(`/memories/${memoryId}`, { method: 'DELETE' });
};

// Companions
export const fetchCompanionsForUser = async (userId: string): Promise<Companion[]> => {
  return fetchApi<Companion[]>(`/companions/user/${userId}`);
};

export const addCompanionForUser = async (userId: string, companionData: Omit<Companion, 'id' | 'userId'>): Promise<Companion> => {
  return fetchApi<Companion>('/companions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...companionData, userId })
  });
};

// Chronicle Events
export const fetchChronicleEventsForUser = async (userId: string): Promise<ChronicleEvent[]> => {
  return fetchApi<ChronicleEvent[]>(`/chronicles/user/${userId}`);
};

export const addChronicleEventForUser = async (userId: string, eventData: Omit<ChronicleEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'sharedWith'>): Promise<ChronicleEvent> => {
  return fetchApi<ChronicleEvent>('/chronicles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...eventData, userId })
  });
};

export const updateChronicleEventForUser = async (userId: string, eventUpdate: ChronicleEvent): Promise<ChronicleEvent> => {
  return fetchApi<ChronicleEvent>(`/chronicles/${eventUpdate.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventUpdate)
  });
};

export const deleteChronicleEventForUser = async (ownerUserId: string, eventId: string): Promise<void> => {
  await fetchApi(`/chronicles/${eventId}`, { method: 'DELETE' });
};

// Sharing
export const shareItem = async (
  itemId: string,
  itemType: 'memory' | 'chronicle',
  targetUserId: string,
  targetUsername: string,
  ownerUserId: string,
  targetUserHandle?: string,
  targetUserAvatarUrl?: string,
  targetUserFirstName?: string,
  targetUserLastName?: string
): Promise<void> => {
  const endpoint = itemType === 'memory' ? `/memories/${itemId}/share` : `/chronicles/${itemId}/share`;
  await fetchApi(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId })
  });
};

export const initializeMockDataForUser = (user: User) => {
  // No-op for real backend
};

// Admin Dashboard Statistics
export const getAdminDashboardStats = async (allUsersFromAuth: User[]): Promise<AdminDashboardStats> => {
  return fetchApi<AdminDashboardStats>('/admin/stats');
};