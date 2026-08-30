import axios from 'axios';
import { useUiStore } from '../store/uiStore';

export const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const TOKEN_KEY = 'fp_access_token';

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/auth/refresh-token`, {}, { withCredentials: true, timeout: 8000 })
      .then((res) => {
        const token = res.data?.data?.accessToken;
        if (token) setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (status === 401 && code === 'TOKEN_EXPIRED' && original && !original._retry) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }
      } catch {
        setAccessToken(null);
      }
    }

    if (status === 409 && code === 'NOT_CONNECTED') {
      const url = `${original?.baseURL || ''}${original?.url || ''}`;
      const match = url.match(/\/servers\/([0-9a-fA-F-]{36})/);
      if (match?.[1]) {
        useUiStore.getState().promptReconnect(match[1]);
      }
    }

    return Promise.reject(error);
  }
);

export function apiErrorMessage(err, fallback = 'Something went wrong') {
  return err?.response?.data?.message || err?.message || fallback;
}

/** Scale request timeout with payload size (large SFTP uploads need server time after send). */
export function transferTimeoutMs(totalBytes, { minMs = 120_000, perMbMs = 30_000, maxMs = 3_600_000 } = {}) {
  const mb = totalBytes / (1024 * 1024);
  const estimated = Math.ceil(Math.max(mb, 1)) * perMbMs;
  return Math.min(Math.max(minMs, estimated), maxMs);
}

export function unwrap(res) {
  return res.data?.data;
}
