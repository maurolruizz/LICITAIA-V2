import axios from "axios";
import { api, refreshClient } from "@/lib/http";
import { isApiErrorBody, isApiSuccessEnvelope } from "@/lib/api-envelope";
import type { ApiSuccessEnvelope } from "@/lib/api-envelope";

/** Corpo da requisição de login (alinhado ao LoginRequestBody do backend). */
export type LoginPayload = {
  tenantSlug: string;
  email: string;
  password: string;
};

/** Usuário autenticado exposto por GET /api/users/me (UserPublic no backend). */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Corpo de `data` em login bem-sucedido (LoginResponseBody no backend). */
/** Corpo de `data` em refresh bem-sucedido (RefreshResponseBody no backend). */
export type RefreshResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
};

function isLoginResultData(data: unknown): data is LoginResult {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (typeof d.accessToken !== "string" || !d.accessToken.trim()) return false;
  if (typeof d.refreshToken !== "string" || !d.refreshToken.trim()) return false;
  if (typeof d.expiresIn !== "number") return false;
  const user = d.user;
  const tenant = d.tenant;
  if (!user || typeof user !== "object" || !tenant || typeof tenant !== "object")
    return false;
  const u = user as Record<string, unknown>;
  const t = tenant as Record<string, unknown>;
  return (
    typeof u.id === "string" &&
    typeof u.email === "string" &&
    typeof u.name === "string" &&
    typeof u.role === "string" &&
    typeof t.id === "string" &&
    typeof t.slug === "string" &&
    typeof t.name === "string"
  );
}

export function parseLoginEnvelope(body: unknown): LoginResult | null {
  if (!isApiSuccessEnvelope(body)) return null;
  return isLoginResultData(body.data) ? body.data : null;
}

function isRefreshResultData(data: unknown): data is RefreshResult {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.accessToken === "string" &&
    !!d.accessToken.trim() &&
    typeof d.refreshToken === "string" &&
    !!d.refreshToken.trim() &&
    typeof d.expiresIn === "number"
  );
}

export function parseRefreshEnvelope(body: unknown): RefreshResult | null {
  if (!isApiSuccessEnvelope(body)) return null;
  return isRefreshResultData(body.data) ? body.data : null;
}

function isAuthUser(data: unknown): data is AuthUser {
  if (!data || typeof data !== "object") return false;
  const u = data as Record<string, unknown>;
  return (
    typeof u.id === "string" &&
    typeof u.email === "string" &&
    typeof u.name === "string" &&
    typeof u.role === "string" &&
    typeof u.status === "string" &&
    typeof u.createdAt === "string" &&
    typeof u.updatedAt === "string" &&
    (u.lastLoginAt === null || typeof u.lastLoginAt === "string")
  );
}

export function parseMeEnvelope(body: unknown): AuthUser | null {
  if (!isApiSuccessEnvelope(body)) return null;
  return isAuthUser(body.data) ? body.data : null;
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const { data: body } = await api.post<unknown>("/api/auth/login", payload);
  const parsed = parseLoginEnvelope(body);
  if (!parsed) {
    throw new Error("Resposta de login em formato inesperado.");
  }
  return parsed;
}

/**
 * Renova access + refresh via backend. Usa cliente Axios sem interceptors
 * para não entrar em loop com o tratamento de 401 da instância principal.
 */
export async function refreshSession(refreshToken: string): Promise<RefreshResult> {
  const { data: body } = await refreshClient.post<unknown>("/api/auth/refresh", {
    refreshToken,
  });
  const parsed = parseRefreshEnvelope(body);
  if (!parsed) {
    throw new Error("Resposta de refresh em formato inesperado.");
  }
  return parsed;
}

export async function getMe(): Promise<AuthUser> {
  const { data: body } = await api.get<unknown>("/api/users/me");
  const user = parseMeEnvelope(body);
  if (!user) {
    throw new Error("Resposta de /api/users/me em formato inesperado.");
  }
  return user;
}

export type LogoutResponse = ApiSuccessEnvelope<{ message: string }>;

export async function logout(refreshToken?: string | null) {
  const { data } = await api.post<unknown>("/api/auth/logout", {
    refreshToken: refreshToken ?? undefined,
  });
  return data;
}

/** Mensagem do envelope de erro do backend, quando presente na resposta Axios. */
export function getLoginErrorMessage(error: unknown): string {
  if (
    axios.isAxiosError(error) &&
    error.response?.data &&
    isApiErrorBody(error.response.data)
  ) {
    return error.response.data.error.message;
  }
  return "Falha ao autenticar.";
}
