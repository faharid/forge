import { useCallback } from 'react';
import { api } from '../services/api';

export function useApi() {
  const get = useCallback(<T,>(url: string) => api.get<T>(url), []);
  const post = useCallback(<T,>(url: string, body?: unknown) => api.post<T>(url, body), []);
  const put = useCallback(<T,>(url: string, body?: unknown) => api.put<T>(url, body), []);
  const del = useCallback(<T,>(url: string) => api.delete<T>(url), []);
  return { get, post, put, del, api };
}
