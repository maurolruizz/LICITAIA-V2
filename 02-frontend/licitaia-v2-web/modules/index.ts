/**
 * Núcleo modular LICITAIA V2 — ponto de entrada público.
 * Infraestrutura do motor de conformidade administrativa.
 */

export * from './core';
export {
  registerModule,
  getModulesForPhase,
  getModuleDefinition,
  getAllRegisteredModuleIds,
  dispatchModule,
  runAdministrativeProcess,
} from './orchestrator';
export type { AdministrativeProcessContext } from './orchestrator';
export type { AdministrativeProcessResult, ProcessStatus } from './orchestrator';
export { initializeModuleRegistry } from './registry';
export { executeDfdModule } from './domain/dfd';
export { executeEtpModule } from './domain/etp';
export { executeTrModule } from './domain/tr';
export { executePricingModule } from './domain/pricing';
export * from './ai-assistive';
