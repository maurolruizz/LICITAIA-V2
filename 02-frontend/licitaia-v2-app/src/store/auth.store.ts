import { create } from "zustand";
import { setAuthorizationToken } from "@/lib/http";
import * as authService from "@/services/auth.service";

const STORAGE_ACCESS = "licitaia.v2.accessToken";
const STORAGE_REFRESH = "licitaia.v2.refreshToken";

function persistTokens(accessToken: string, refreshToken: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_ACCESS, accessToken);
  sessionStorage.setItem(STORAGE_REFRESH, refreshToken);
}

function readStoredTokens(): { access: string | null; refresh: string | null } {
  if (typeof sessionStorage === "undefined") {
    return { access: null, refresh: null };
  }
  return {
    access: sessionStorage.getItem(STORAGE_ACCESS),
    refresh: sessionStorage.getItem(STORAGE_REFRESH),
  };
}

function clearStoredTokens() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_ACCESS);
  sessionStorage.removeItem(STORAGE_REFRESH);
}

type User = authService.AuthUser | null;

type AuthState = {
  user: User;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  initialized: boolean;
  /** Atualiza tokens após refresh (persistência + header Axios). */
  applyTokens: (accessToken: string, refreshToken: string) => void;
  /** Limpa sessão inválida e envia para /login (ex.: refresh falhou ou 401 após retry). */
  invalidateSession: () => void;
  bootstrap: () => Promise<void>;
  signIn: (params: {
    email: string;
    password: string;
    tenantSlug: string;
  }) => Promise<void>;
  loadMe: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  initialized: false,

  applyTokens: (accessToken, refreshToken) => {
    persistTokens(accessToken, refreshToken);
    setAuthorizationToken(accessToken);
    set({ accessToken, refreshToken });
  },

  invalidateSession: () => {
    setAuthorizationToken(null);
    clearStoredTokens();
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      initialized: true,
    });
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path !== "/login") {
        window.location.replace("/login");
      }
    }
  },

  bootstrap: async () => {
    const { access, refresh } = readStoredTokens();
    if (!access) {
      set({ initialized: true });
      return;
    }

    setAuthorizationToken(access);
    set({ accessToken: access, refreshToken: refresh });

    try {
      const user = await authService.getMe();
      set({ user, initialized: true });
    } catch {
      setAuthorizationToken(null);
      clearStoredTokens();
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        initialized: true,
      });
    }
  },

  signIn: async ({ email, password, tenantSlug }) => {
    set({ loading: true });

    try {
      const result = await authService.login({ email, password, tenantSlug });
      persistTokens(result.accessToken, result.refreshToken);
      setAuthorizationToken(result.accessToken);
      set({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        loading: false,
      });

      const user = await authService.getMe();
      set({ user, initialized: true });
    } catch (error) {
      setAuthorizationToken(null);
      clearStoredTokens();
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        loading: false,
        initialized: true,
      });
      throw error;
    }
  },

  loadMe: async () => {
    if (!get().accessToken) {
      set({ initialized: true });
      return;
    }

    try {
      const user = await authService.getMe();
      set({ user, initialized: true });
    } catch {
      setAuthorizationToken(null);
      clearStoredTokens();
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        initialized: true,
      });
    }
  },

  signOut: async () => {
    const refresh = get().refreshToken;
    try {
      await authService.logout(refresh);
    } finally {
      setAuthorizationToken(null);
      clearStoredTokens();
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        initialized: true,
      });
    }
  },
}));
