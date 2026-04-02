/**
 * Contratos mínimos locais para interação do backend com o núcleo administrativo.
 * Mantêm compatibilidade estrutural com os tipos reais do frontend,
 * sem acoplamento direto de compilação a arquivos fora de src.
 */

export interface AdministrativeProcessContext {
  processId: string;
  tenantId?: string;
  userId?: string;
  phase: string;
  payload: Record<string, unknown>;
  timestamp?: string;
  correlationId?: string;
  execution?: { source: 'standard_execution' | 'preflight' };
}

export interface AdministrativeProcessResult {
  success: boolean;
  status: string;
  finalStatus: string;
  halted: boolean;
  events: unknown[];
  metadata: Record<string, unknown>;
  validations: unknown[];
  // Campos adicionais existem no núcleo, mas não são necessários para o backend.
  [key: string]: unknown;
}

