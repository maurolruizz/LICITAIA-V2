import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

/**
 * Cliente sem interceptors — usado só para POST /api/auth/refresh, evitando loop com 401.
 */
export const refreshClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

export function setAuthorizationToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

function shouldSkipAuthRefresh(requestUrl: string): boolean {
  return (
    requestUrl.includes("/api/auth/login") ||
    requestUrl.includes("/api/auth/refresh")
  );
}

/** Uma única renovação em voo; requisições 401 concurrentes aguardam a mesma Promise. */
let refreshPromise: Promise<boolean> | null = null;

async function runQueuedRefresh(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async (): Promise<boolean> => {
    const { useAuthStore } = await import("@/store/auth.store");
    const rt = useAuthStore.getState().refreshToken;
    if (!rt) {
      useAuthStore.getState().invalidateSession();
      return false;
    }
    try {
      const { refreshSession } = await import("@/services/auth.service");
      const tokens = await refreshSession(rt);
      useAuthStore.getState().applyTokens(tokens.accessToken, tokens.refreshToken);
      return true;
    } catch {
      useAuthStore.getState().invalidateSession();
      return false;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const cfg = error.config as RetryConfig | undefined;
    if (!cfg || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const path = cfg.url ?? "";
    if (shouldSkipAuthRefresh(path)) {
      return Promise.reject(error);
    }

    if (cfg._retry) {
      const { useAuthStore } = await import("@/store/auth.store");
      useAuthStore.getState().invalidateSession();
      return Promise.reject(error);
    }

    cfg._retry = true;

    const ok = await runQueuedRefresh();
    if (!ok) {
      return Promise.reject(error);
    }

    const { useAuthStore } = await import("@/store/auth.store");
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      useAuthStore.getState().invalidateSession();
      return Promise.reject(error);
    }

    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${token}`;
    return api(cfg);
  },
);
