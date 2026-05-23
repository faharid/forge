import { api } from './api';

export const tenantService = {
  getMe: () => api.get('/tenants/me'),
  updateMe: (name: string) => api.put('/tenants/me', { name }),
  invite: (email: string) => api.post('/tenants/me/invite', { email }),
};
