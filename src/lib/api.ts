import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const base = import.meta.env.VITE_API_URL ?? '';

export const api = axios.create({
  baseURL: base,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('rms_access');
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

function responseLooksLikeHtml(data: unknown): boolean {
  if (typeof data !== 'string') return false;
  const s = data.trimStart().toLowerCase();
  return s.startsWith('<!doctype') || s.startsWith('<html') || s.startsWith('<head');
}

api.interceptors.response.use(
  (r) => {
    const path = r.config.url || '';
    const isApi = path.includes('/api');
    if (isApi && responseLooksLikeHtml(r.data)) {
      return Promise.reject(
        new Error(
          'The server returned a web page instead of JSON. Is the API running and is VITE_API_URL set correctly when not using the Vite dev/preview proxy?'
        )
      );
    }
    return r;
  },
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (!orig || orig._retry) throw error;
    if (error.response?.status !== 401) throw error;
    if (orig.url?.includes('/auth/refresh')) throw error;

    const refresh = localStorage.getItem('rms_refresh');
    if (!refresh) throw error;
    orig._retry = true;
    try {
      const { data } = await axios.post(`${base || ''}/api/auth/refresh`, { refreshToken: refresh });
      localStorage.setItem('rms_access', data.accessToken);
      localStorage.setItem('rms_refresh', data.refreshToken);
      if (data.user) {
        localStorage.setItem('rms_user', JSON.stringify(data.user));
      }
      orig.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(orig);
    } catch {
      localStorage.removeItem('rms_access');
      localStorage.removeItem('rms_refresh');
      localStorage.removeItem('rms_user');
      throw error;
    }
  }
);

export function assetUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const b = import.meta.env.VITE_API_URL ?? '';
  return `${b}${path}`;
}
