import axios from 'axios';
import type { User, Widget, LayoutItem, Theme } from './types';

const api = axios.create({
  baseURL: '/api',
});

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('orbix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export async function login(
  username: string,
  password: string
): Promise<{ token: string; user: User }> {
  const res = await api.post('/auth/login', { username, password });
  return res.data;
}

export async function register(
  username: string,
  password: string
): Promise<{ token: string; user: User }> {
  const res = await api.post('/auth/register', { username, password });
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await api.get('/auth/me');
  return res.data;
}

// Layout
export async function getLayout(): Promise<LayoutItem[]> {
  const res = await api.get('/dashboard/layout');
  return res.data;
}

export async function saveLayout(layout: LayoutItem[]): Promise<void> {
  await api.put('/dashboard/layout', { layout });
}

// Widgets
export async function getWidgets(): Promise<Widget[]> {
  const res = await api.get('/dashboard/widgets');
  return res.data;
}

export async function createWidget(
  type: string,
  config: Record<string, unknown>
): Promise<Widget> {
  const res = await api.post('/dashboard/widgets', { type, config });
  return res.data;
}

export async function updateWidget(
  id: string,
  config: Record<string, unknown>
): Promise<Widget> {
  const res = await api.put(`/dashboard/widgets/${id}`, { config });
  return res.data;
}

export async function deleteWidget(id: string): Promise<void> {
  await api.delete(`/dashboard/widgets/${id}`);
}

// Theme
export async function getTheme(): Promise<Theme> {
  const res = await api.get('/dashboard/theme');
  return res.data;
}

export async function saveTheme(theme: Theme): Promise<void> {
  await api.put('/dashboard/theme', theme);
}
