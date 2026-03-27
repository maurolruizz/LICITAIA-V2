"use strict";
/**
 * Mappers do módulo TR.
 * Normalização do payload antes da validação e extração de contexto.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTrPayload = normalizeTrPayload;
exports.mapTrPayloadToContext = mapTrPayloadToContext;
const TR_PAYLOAD_KEYS = [
    'objectDescription',
    'contractingPurpose',
    'technicalRequirements',
    'executionConditions',
    'acceptanceCriteria',
    'requestingDepartment',
    'responsibleAuthor',
    'referenceDate',
    'additionalNotes',
];
/**
 * Normaliza o payload recebido para o formato esperado pelo TR.
 * Garante presença das chaves obrigatórias (string vazia se ausente) para validação.
 */
function normalizeTrPayload(payload) {
    const raw = payload ?? {};
    const normalized = {};
    for (const key of TR_PAYLOAD_KEYS) {
        const value = raw[key];
        if (value === undefined || value === null) {
            normalized[key] = '';
        }
        else {
            normalized[key] = typeof value === 'string' ? value : String(value);
        }
    }
    // Preserva estrutura de objeto (retrocompatível; não altera contratos centrais)
    if (raw['structureType'] !== undefined)
        normalized['structureType'] = raw['structureType'];
    if (raw['items'] !== undefined)
        normalized['items'] = raw['items'];
    if (raw['lots'] !== undefined)
        normalized['lots'] = raw['lots'];
    if (raw['lotJustification'] !== undefined)
        normalized['lotJustification'] = raw['lotJustification'];
    if (raw['calculationMemories'] !== undefined)
        normalized['calculationMemories'] = raw['calculationMemories'];
    if (raw['calculationMemory'] !== undefined)
        normalized['calculationMemory'] = raw['calculationMemory'];
    if (raw['administrativeJustifications'] !== undefined)
        normalized['administrativeJustifications'] = raw['administrativeJustifications'];
    if (raw['administrativeJustification'] !== undefined)
        normalized['administrativeJustification'] = raw['administrativeJustification'];
    if (raw['administrativeNeeds'] !== undefined)
        normalized['administrativeNeeds'] = raw['administrativeNeeds'];
    if (raw['administrativeNeed'] !== undefined)
        normalized['administrativeNeed'] = raw['administrativeNeed'];
    if (raw['procurementStrategies'] !== undefined)
        normalized['procurementStrategies'] = raw['procurementStrategies'];
    if (raw['procurementStrategy'] !== undefined)
        normalized['procurementStrategy'] = raw['procurementStrategy'];
    return normalized;
}
/**
 * Extrai contexto do input para uso interno (metadados, eventos).
 */
function mapTrPayloadToContext(input) {
    return {
        termId: input.payload?.termId,
        phase: input.phase,
        ...input.context,
    };
}
