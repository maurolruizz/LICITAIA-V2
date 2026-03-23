/**
 * Validações reais do módulo TR (Termo de Referência).
 * Campos obrigatórios, textos não vazios, bloqueio quando faltar campo estrutural.
 */

import type { ValidationItemContract, ValidationResultContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { createValidationItem, createValidationResult } from '../../core/factories/validation-result.factory';
import { extractProcurementStructure } from '../shared/object-structure.extractor';
import { applyObjectStructureValidations } from '../shared/object-structure.validator';
import { extractCalculationMemory } from '../shared/calculation-memory.extractor';
import { applyCalculationMemoryValidations } from '../shared/calculation-memory.validator';
import { extractAdministrativeJustification } from '../shared/administrative-justification.extractor';
import { applyAdministrativeJustificationValidations } from '../shared/administrative-justification.validator';
import { executeAdministrativeCoherenceEngine } from '../shared/administrative-coherence.engine';
import { applyAdministrativeCoherenceValidations } from '../shared/administrative-coherence.validator';
import { extractAdministrativeNeed } from '../shared/administrative-need.extractor';
import { applyAdministrativeNeedValidations } from '../shared/administrative-need.validator';
import { extractProcurementStrategy } from '../shared/procurement-strategy.extractor';
import { applyProcurementStrategyValidations } from '../shared/procurement-strategy.validator';
import { executeAdministrativeDocumentConsistencyEngine } from '../shared/administrative-document-consistency.engine';
import { applyAdministrativeDocumentConsistencyValidations } from '../shared/administrative-document-consistency.validator';

const BLOCK_ON_MISSING = true;

function isEmptyText(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'string') return true;
  return value.trim().length === 0;
}

function validateRequiredTextField(
  payload: Record<string, unknown>,
  field: string,
  label: string,
  items: ValidationItemContract[],
  useBlock: boolean
): void {
  const value = payload[field];
  if (value === undefined || value === null) {
    items.push(
      createValidationItem(
        'TR_FIELD_MISSING',
        `${label} é obrigatório`,
        useBlock ? ValidationSeverity.BLOCK : ValidationSeverity.ERROR,
        { field }
      )
    );
    return;
  }
  if (isEmptyText(value)) {
    items.push(
      createValidationItem(
        'TR_FIELD_EMPTY',
        `${label} não pode ser vazio`,
        useBlock ? ValidationSeverity.BLOCK : ValidationSeverity.ERROR,
        { field }
      )
    );
  }
}

/**
 * Validações reais mínimas do TR.
 * Bloqueia quando faltar campo estrutural obrigatório.
 */
export function validateTrInput(payload: Record<string, unknown>): ValidationResultContract {
  const items: ValidationItemContract[] = [];

  validateRequiredTextField(
    payload,
    'objectDescription',
    'Descrição do objeto',
    items,
    BLOCK_ON_MISSING
  );
  validateRequiredTextField(
    payload,
    'contractingPurpose',
    'Finalidade da contratação',
    items,
    BLOCK_ON_MISSING
  );
  validateRequiredTextField(
    payload,
    'technicalRequirements',
    'Requisitos técnicos',
    items,
    BLOCK_ON_MISSING
  );
  validateRequiredTextField(
    payload,
    'executionConditions',
    'Condições de execução',
    items,
    BLOCK_ON_MISSING
  );
  validateRequiredTextField(
    payload,
    'acceptanceCriteria',
    'Critérios de aceitação',
    items,
    BLOCK_ON_MISSING
  );
  validateRequiredTextField(
    payload,
    'requestingDepartment',
    'Área solicitante',
    items,
    BLOCK_ON_MISSING
  );
  validateRequiredTextField(
    payload,
    'responsibleAuthor',
    'Responsável pelo TR',
    items,
    BLOCK_ON_MISSING
  );

  if (payload.referenceDate === undefined || payload.referenceDate === null) {
    items.push(
      createValidationItem(
        'TR_FIELD_MISSING',
        'Data de referência é obrigatória',
        ValidationSeverity.BLOCK,
        { field: 'referenceDate' }
      )
    );
  } else if (typeof payload.referenceDate !== 'string' || payload.referenceDate.trim() === '') {
    items.push(
      createValidationItem(
        'TR_FIELD_EMPTY',
        'Data de referência não pode ser vazia',
        ValidationSeverity.BLOCK,
        { field: 'referenceDate' }
      )
    );
  }

  const extracted = extractProcurementStructure(payload);
  applyObjectStructureValidations(extracted, payload, items);

  const calculationMemory = extractCalculationMemory(payload);
  applyCalculationMemoryValidations(extracted, calculationMemory.entries, items);

  const administrativeJustification = extractAdministrativeJustification(payload);
  const rawJustificationEntries = Array.isArray(payload.administrativeJustifications)
    ? payload.administrativeJustifications
    : payload.administrativeJustification != null
      ? [payload.administrativeJustification]
      : [];
  applyAdministrativeJustificationValidations(extracted, administrativeJustification.entries, items, rawJustificationEntries);

  const coherenceResult = executeAdministrativeCoherenceEngine(
    extracted,
    calculationMemory,
    administrativeJustification
  );
  applyAdministrativeCoherenceValidations(coherenceResult, items);

  const administrativeNeed = extractAdministrativeNeed(payload);
  const rawNeedEntries = Array.isArray(payload.administrativeNeeds)
    ? payload.administrativeNeeds
    : payload.administrativeNeed != null
      ? [payload.administrativeNeed]
      : [];
  applyAdministrativeNeedValidations(extracted, administrativeNeed.entries, items, rawNeedEntries);

  const procurementStrategy = extractProcurementStrategy(payload);
  const rawStrategyEntries = Array.isArray(payload.procurementStrategies)
    ? payload.procurementStrategies
    : payload.procurementStrategy != null
      ? [payload.procurementStrategy]
      : [];
  applyProcurementStrategyValidations(extracted, procurementStrategy.entries, items, rawStrategyEntries);

  const documentConsistencyResult = executeAdministrativeDocumentConsistencyEngine(
    extracted,
    calculationMemory,
    administrativeNeed,
    administrativeJustification,
    procurementStrategy
  );
  applyAdministrativeDocumentConsistencyValidations(documentConsistencyResult, items);

  return createValidationResult(items);
}
