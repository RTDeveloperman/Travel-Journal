import { User } from '../types';

const API_BASE = '/api/auth';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Auth request failed');
  }
  return response.json();
}

export const loginUser = async (username: string, password_placeholder: string): Promise<User | null> => {
  try {
    return await fetchApi<User>('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: password_placeholder })
    });
  } catch (error) {
    console.error('Login failed:', error);
    return null;
  }
};

export const fetchAllUsersPublicList = async (): Promise<User[]> => {
  return fetchApi<User[]>('/users');
};

export const updateUserProfile = async (userId: string, payload: any): Promise<User> => {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Update profile failed');
  }
  return response.json();
};

export const sendFollowRequest = async (followerId: string, followingId: string) => {
  const response = await fetch('/api/users/follow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ followerId, followingId })
  });
  if (!response.ok) throw new Error('Failed to send follow request');
  return response.json();
};

export const acceptFollowRequest = async (userId: string, requesterId: string) => {
  const response = await fetch('/api/users/follow/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, requesterId })
  });
  if (!response.ok) throw new Error('Failed to accept follow request');
  return response.json();
};

export const declineFollowRequest = async (userId: string, requesterId: string) => {
  console.warn("Decline follow request not implemented in backend");
  return { success: true };
};

export const unfollowUser = async (userId: string, targetId: string) => {
  console.warn("Unfollow user not implemented in backend");
  return { success: true };
};

// Admin Functions
export const fetchUsersForAdmin = async (currentUser: User): Promise<User[]> => {
  // For now, reuse the public list, but in real app this might return more details
  return fetchAllUsersPublicList();
};

export const adminCreateUser = async (currentUser: User, userData: any): Promise<User> => {
  return fetchApi<User>('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
};

export const adminUpdateUser = async (currentUser: User, targetUserId: string, payload: any): Promise<User> => {
  // Reuse the general update profile function
  return updateUserProfile(targetUserId, payload);
};

export const adminResetUserPassword = async (currentUser: User, targetUserId: string, newPassword: string): Promise<any> => {
  return fetchApi(`/admin/users/${targetUserId}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword })
  });
};

export const adminBanUser = async (currentUser: User, targetUserId: string, isBanned: boolean): Promise<User> => {
  return fetchApi<User>(`/admin/users/${targetUserId}/ban`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isBanned })
  });
};