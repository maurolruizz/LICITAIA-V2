/**
 * Factory para resultados padronizados de módulos.
 */

import type { ModuleResult } from '../types/result.types';
import type { ResultStatus } from '../types/result.types';

export function createModuleResult(
  status: ResultStatus,
  options?: { message?: string; data?: Record<string, unknown>; codes?: string[] }
): ModuleResult {
  return {
    status,
    message: options?.message,
    data: options?.data,
    codes: options?.codes,
  };
}

export function createSuccessResult(
  data?: Record<string, unknown>,
  message?: string
): ModuleResult {
  return createModuleResult('success', { message: message ?? 'OK', data });
}

export function createFailureResult(
  message: string,
  codes?: string[]
): ModuleResult {
  return createModuleResult('failure', { message, codes });
}

export function createBlockedResult(
  message: string,
  codes?: string[]
): ModuleResult {
  return createModuleResult('blocked', { message, codes });
}
