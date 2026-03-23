/**
 * Contrato de saída padronizada dos módulos do motor LICITAIA V2.
 */

import type { ModuleId } from '../enums/module-id.enum';
import type { ModuleResult } from '../types/result.types';
import type { AdministrativeEventContract } from './event.contract';

export interface ModuleOutputContract {
  /** Identificador do módulo que produziu o resultado */
  moduleId: ModuleId;
  /** Resultado estruturado (sucesso, falha, bloqueio) */
  result: ModuleResult;
  /** Indica se o fluxo deve ser interrompido (bloqueio) */
  shouldHalt: boolean;
  /** Eventos administrativos emitidos pelo módulo (campo oficial) */
  events?: AdministrativeEventContract[];
  /** Metadados opcionais produzidos pelo módulo */
  metadata?: Record<string, unknown>;
}
