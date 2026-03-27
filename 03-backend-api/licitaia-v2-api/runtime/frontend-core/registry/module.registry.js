"use strict";
/**
 * Registro central de módulos do motor LICITAIA V2.
 * Registra todos os módulos de domínio disponíveis no orquestrador.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeModuleRegistry = initializeModuleRegistry;
const flow_registry_1 = require("../orchestrator/flow-registry");
const module_id_enum_1 = require("../core/enums/module-id.enum");
const process_phase_enum_1 = require("../core/enums/process-phase.enum");
const dfd_1 = require("../domain/dfd");
const etp_1 = require("../domain/etp");
const tr_1 = require("../domain/tr");
const pricing_1 = require("../domain/pricing");
const ALL_PHASES = Object.values(process_phase_enum_1.ProcessPhase);
function registerAllModules() {
    (0, flow_registry_1.registerModule)({
        id: module_id_enum_1.ModuleId.DFD,
        name: 'DFD',
        phases: ALL_PHASES,
        execute: dfd_1.executeDfdModule,
    });
    (0, flow_registry_1.registerModule)({
        id: module_id_enum_1.ModuleId.ETP,
        name: 'ETP',
        phases: ALL_PHASES,
        execute: etp_1.executeEtpModule,
    });
    (0, flow_registry_1.registerModule)({
        id: module_id_enum_1.ModuleId.TR,
        name: 'TR',
        phases: ALL_PHASES,
        execute: tr_1.executeTrModule,
    });
    (0, flow_registry_1.registerModule)({
        id: module_id_enum_1.ModuleId.PRICING,
        name: 'Pricing',
        phases: ALL_PHASES,
        execute: pricing_1.executePricingModule,
    });
}
/** Inicializa o registro de módulos. Deve ser chamado na bootstrap da aplicação. */
function initializeModuleRegistry() {
    registerAllModules();
}
