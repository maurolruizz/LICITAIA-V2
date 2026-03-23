/**
 * Tipos de erro do motor modular.
 */

export interface ModuleError {
  code: string;
  message: string;
  moduleId?: string;
  details?: Record<string, unknown>;
}

export interface ValidationError extends ModuleError {
  field?: string;
  severity?: string;
}
