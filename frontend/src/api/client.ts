import axios from 'axios';
import { Category, Credential, UserProfile, AuthResponse, ManagedUser } from '@/types';

let dynamicApiKey: string | undefined = import.meta.env.VITE_API_KEY ?? 'norax-dev-key';
let authToken: string | undefined;

export const setApiKey = (key?: string) => {
  dynamicApiKey = key || import.meta.env.VITE_API_KEY;
};

export const setAuthToken = (token?: string) => {
  authToken = token;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5248/api',
});

api.interceptors.request.use((config) => {
  if (dynamicApiKey) {
    config.headers = {
      ...config.headers,
      'X-API-KEY': dynamicApiKey,
    };
  }
  if (authToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${authToken}`,
    };
  }
  return config;
});

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<Category[]>('/categories');
  return data;
};

export const createCategory = async (payload: { name: string; description?: string }) => {
  const { data } = await api.post<Category>('/categories', payload);
  return data;
};

export const updateCategory = async (id: string, payload: { name: string; description?: string }) => {
  const { data } = await api.put<Category>(`/categories/${id}`, payload);
  return data;
};

export const deleteCategory = async (id: string) => {
  await api.delete(`/categories/${id}`);
};

export const getCredentials = async (categoryId?: string): Promise<Credential[]> => {
  const { data } = await api.get<Credential[]>('/credentials', {
    params: categoryId ? { categoryId } : undefined,
  });
  return data;
};

export const createCredential = async (
  payload: Omit<Credential, 'id' | 'createdAtUtc' | 'updatedAtUtc' | 'canViewSecret'>,
) => {
  const { data } = await api.post<Credential>('/credentials', payload);
  return data;
};

export const updateCredential = async (
  id: string,
  payload: Omit<Credential, 'id' | 'createdAtUtc' | 'updatedAtUtc' | 'canViewSecret'>,
) => {
  const { data } = await api.put<Credential>(`/credentials/${id}`, payload);
  return data;
};

export const deleteCredential = async (id: string) => {
  await api.delete(`/credentials/${id}`);
};

export const loginUser = async (payload: { email: string; password: string }): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
};

export const registerUser = async (payload: { email: string; password: string; role?: string }): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
};

export const getMe = async (): Promise<UserProfile> => {
  const { data } = await api.get<UserProfile>('/auth/me');
  return data;
};

export const getUsers = async (): Promise<ManagedUser[]> => {
  const { data } = await api.get<ManagedUser[]>('/users');
  return data;
};

export const createManagedUser = async (payload: { email: string; password: string; role?: string }) => {
  const { data } = await api.post<ManagedUser>('/users', payload);
  return data;
};

export const updateManagedUser = async (
  id: string,
  payload: { email: string; role: string; password?: string },
) => {
  const { data } = await api.put<ManagedUser>(`/users/${id}`, payload);
  return data;
};

export const deleteManagedUser = async (id: string) => {
  await api.delete(`/users/${id}`);
};

export const updateUserAccess = async (id: string, credentialIds: string[]) => {
  const { data } = await api.put<ManagedUser>(`/users/${id}/access`, { credentialIds });
  return data;
};
