import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

export const authService = {
  signup: (email: string, password: string, tenantName?: string) =>
    api.post('/auth/signup', { email, password, tenantName }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
};
