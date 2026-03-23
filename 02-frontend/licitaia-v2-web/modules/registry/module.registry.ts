/**
 * Registro central de módulos do motor LICITAIA V2.
 * Registra todos os módulos de domínio disponíveis no orquestrador.
 */

import { registerModule } from '../orchestrator/flow-registry';
import { ModuleId } from '../core/enums/module-id.enum';
import { ProcessPhase } from '../core/enums/process-phase.enum';
import { executeDfdModule } from '../domain/dfd';
import { executeEtpModule } from '../domain/etp';
import { executeTrModule } from '../domain/tr';
import { executePricingModule } from '../domain/pricing';

const ALL_PHASES = Object.values(ProcessPhase) as string[];

function registerAllModules(): void {
  registerModule({
    id: ModuleId.DFD,
    name: 'DFD',
    phases: ALL_PHASES,
    execute: executeDfdModule,
  });
  registerModule({
    id: ModuleId.ETP,
    name: 'ETP',
    phases: ALL_PHASES,
    execute: executeEtpModule,
  });
  registerModule({
    id: ModuleId.TR,
    name: 'TR',
    phases: ALL_PHASES,
    execute: executeTrModule,
  });
  registerModule({
    id: ModuleId.PRICING,
    name: 'Pricing',
    phases: ALL_PHASES,
    execute: executePricingModule,
  });
}

/** Inicializa o registro de módulos. Deve ser chamado na bootstrap da aplicação. */
export function initializeModuleRegistry(): void {
  registerAllModules();
}
