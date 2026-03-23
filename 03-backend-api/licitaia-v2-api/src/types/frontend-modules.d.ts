/**
 * Ponte de tipos local do backend para o núcleo frontend.
 * Evita que o TypeScript inclua os .ts do frontend fora de rootDir,
 * expondo apenas o contrato mínimo necessário para o endpoint.
 */

import type { ProcessRunRequest } from '../dto/process-run-request.types';

declare module '../../../../02-frontend/licitaia-v2-web/modules' {
  /**
   * Contexto administrativo mínimo esperado por runAdministrativeProcess.
   * Compatível estruturalmente com o tipo real no frontend.
   */
  export interface AdministrativeProcessContext {
    processId: string;
    tenantId?: string;
    userId?: string;
    phase: string;
    payload: Record<string, unknown>;
    timestamp?: string;
    correlationId?: string;
  }

  /**
   * Resultado administrativo mínimo exposto para o backend.
   * Mantém apenas o que o controller consome para montar a resposta.
   */
  export interface AdministrativeProcessResult {
    success: boolean;
    status: string;
    finalStatus: string;
    halted: boolean;
    events: unknown[];
    metadata: Record<string, unknown>;
    validations: unknown[];
    // Campos adicionais existem no núcleo, mas não são necessários para o backend.
    // Usamos any estrutural aqui para não invadir o domínio.
    [key: string]: unknown;
  }

  /**
   * Assinatura mínima de execução do motor administrativo.
   * Compatível com o contrato real do núcleo.
   */
  export function runAdministrativeProcess(
    context: AdministrativeProcessContext
  ): Promise<AdministrativeProcessResult>;
}

