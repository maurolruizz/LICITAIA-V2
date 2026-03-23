import type { ValidationItemContract } from '../../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../../core/enums/validation-severity.enum';
import { createValidationItem } from '../../../core/factories/validation-result.factory';
import type { ModuleId } from '../../../core/enums/module-id.enum';
import {
  hasMinimumTermOverlap,
  tokenizeForComparison,
} from '../cross-module/cross-module-consistency-rules';
import { LEGAL_BASIS_REQUIRED_KEYWORDS } from '../../../domain/shared/administrative-document-consistency.types';

const MIN_OBJECT_LENGTH_WARNING = 20;
const MIN_OBJECT_LENGTH_INFO = 10;
const MIN_JUSTIFICATION_LENGTH_WARNING = 40;

const GENERIC_OBJECT_PATTERNS: RegExp[] = [
  /materiais?\s+diversos?/i,
  /itens?\s+diversos?/i,
  /servi[cç]os?\s+diversos?/i,
  /compras?\s+diversas?/i,
  /aquisi[cç][aã]o\s+de\s+materiais?/i,
  /\bdiversos?\b/i,
];

export interface LegalFieldConfig {
  field: string;
  label: string;
}

export interface ModuleLegalConfig {
  moduleId: ModuleId;
  objectFields: LegalFieldConfig[];
  justificationFields: LegalFieldConfig[];
}

export const LEGAL_MODULE_CONFIG: ModuleLegalConfig[] = [
  {
    moduleId: 'DFD' as ModuleId,
    objectFields: [{ field: 'demandDescription', label: 'descrição da demanda' }],
    justificationFields: [
      { field: 'hiringJustification', label: 'justificativa da contratação' },
    ],
  },
  {
    moduleId: 'ETP' as ModuleId,
    objectFields: [
      { field: 'needDescription', label: 'descrição da necessidade' },
      { field: 'solutionSummary', label: 'resumo da solução' },
    ],
    justificationFields: [
      { field: 'technicalJustification', label: 'justificativa técnica' },
    ],
  },
  {
    moduleId: 'TR' as ModuleId,
    objectFields: [{ field: 'objectDescription', label: 'descrição do objeto' }],
    justificationFields: [
      { field: 'contractingPurpose', label: 'finalidade da contratação' },
    ],
  },
  {
    moduleId: 'PRICING' as ModuleId,
    objectFields: [
      {
        field: 'referenceItemsDescription',
        label: 'descrição dos itens de referência',
      },
    ],
    justificationFields: [
      {
        field: 'pricingJustification',
        label: 'justificativa da estimativa de preços',
      },
    ],
  },
];

export function getModuleLegalConfig(
  moduleId: ModuleId
): ModuleLegalConfig | undefined {
  return LEGAL_MODULE_CONFIG.find((c) => c.moduleId === moduleId);
}

export function getLegalText(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return String(value ?? '').trim();
  return value.trim();
}

function isGenericObject(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < MIN_OBJECT_LENGTH_INFO) return true;
  const tokens = tokenizeForComparison(trimmed);
  if (tokens.length <= 2) return true;
  return GENERIC_OBJECT_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function evaluateLegalObjectGenericity(
  moduleId: ModuleId,
  payload: Record<string, unknown>
): ValidationItemContract[] {
  const cfg = getModuleLegalConfig(moduleId);
  if (!cfg) return [];

  const items: ValidationItemContract[] = [];

  for (const fieldCfg of cfg.objectFields) {
    const raw = payload[fieldCfg.field];
    const text = getLegalText(raw);
    if (!text) {
      continue;
    }
    if (text.length < MIN_OBJECT_LENGTH_WARNING || isGenericObject(text)) {
      const severity =
        text.length < MIN_OBJECT_LENGTH_INFO || isGenericObject(text)
          ? ValidationSeverity.WARNING
          : ValidationSeverity.INFO;
      items.push(
        createValidationItem(
          'LEGAL_OBJECT_GENERIC',
          `Objeto potencialmente genérico em ${fieldCfg.label}. Detalhar melhor a descrição.`,
          severity,
          {
            field: fieldCfg.field,
            details: {
              moduleId,
              field: fieldCfg.field,
              length: text.length,
            },
          }
        )
      );
    }
  }

  return items;
}

export function evaluateLegalJustificationStrength(
  moduleId: ModuleId,
  payload: Record<string, unknown>
): ValidationItemContract[] {
  const cfg = getModuleLegalConfig(moduleId);
  if (!cfg) return [];

  const items: ValidationItemContract[] = [];

  for (const fieldCfg of cfg.justificationFields) {
    const raw = payload[fieldCfg.field];
    const text = getLegalText(raw);

    if (!raw || text.length === 0) {
      items.push(
        createValidationItem(
          'LEGAL_JUSTIFICATION_MISSING',
          `Justificativa ausente em ${fieldCfg.label}.`,
          ValidationSeverity.BLOCK,
          {
            field: fieldCfg.field,
            details: { moduleId, field: fieldCfg.field },
          }
        )
      );
      continue;
    }

    if (text.length < MIN_JUSTIFICATION_LENGTH_WARNING) {
      items.push(
        createValidationItem(
          'LEGAL_JUSTIFICATION_WEAK',
          `Justificativa muito curta em ${fieldCfg.label}.`,
          ValidationSeverity.WARNING,
          {
            field: fieldCfg.field,
            details: {
              moduleId,
              field: fieldCfg.field,
              length: text.length,
            },
          }
        )
      );
    }
  }

  return items;
}

/**
 * ETAPA A — Dispensa/inexigibilidade exigem menção explícita a base legal nos textos de justificativa.
 */
export function evaluateRegimeLegalBasisCompliance(
  moduleId: ModuleId,
  processSnapshot: Record<string, unknown>,
  mergedData: Record<string, unknown>
): ValidationItemContract[] {
  const regimeRaw = processSnapshot['legalRegime'];
  const regime =
    typeof regimeRaw === 'string' ? regimeRaw.trim().toUpperCase() : '';
  if (regime !== 'DISPENSA' && regime !== 'INEXIGIBILIDADE') {
    return [];
  }

  const cfg = getModuleLegalConfig(moduleId);
  if (!cfg) return [];

  const justificationTexts: string[] = [];
  for (const fieldCfg of cfg.justificationFields) {
    const t = getLegalText(mergedData[fieldCfg.field]);
    if (t) justificationTexts.push(t);
  }
  const combined = justificationTexts.join(' ').toLowerCase();
  if (!combined.trim()) {
    return [];
  }

  const hasBasis = (LEGAL_BASIS_REQUIRED_KEYWORDS as readonly string[]).some((kw) =>
    combined.includes(kw.toLowerCase())
  );
  if (hasBasis) {
    return [];
  }

  return [
    createValidationItem(
      'LEGAL_BASIS_REQUIRED_FOR_DIRECT_REGIME',
      `Regime ${regime} exige menção explícita à base legal (dispensa/inexigibilidade/art. 75/Lei 14.133) na justificativa do módulo ${moduleId}.`,
      ValidationSeverity.BLOCK,
      {
        details: { moduleId, regime },
      }
    ),
  ];
}

export function evaluateLegalObjectJustificationCoherence(
  moduleId: ModuleId,
  payload: Record<string, unknown>
): ValidationItemContract[] {
  const cfg = getModuleLegalConfig(moduleId);
  if (!cfg) return [];

  const objectTexts: string[] = [];
  for (const fieldCfg of cfg.objectFields) {
    const t = getLegalText(payload[fieldCfg.field]);
    if (t) objectTexts.push(t);
  }

  const justificationTexts: string[] = [];
  for (const fieldCfg of cfg.justificationFields) {
    const t = getLegalText(payload[fieldCfg.field]);
    if (t) justificationTexts.push(t);
  }

  if (objectTexts.length === 0 || justificationTexts.length === 0) {
    return [];
  }

  const objectCombined = objectTexts.join(' ').trim();
  const justificationCombined = justificationTexts.join(' ').trim();

  if (!objectCombined || !justificationCombined) return [];

  const overlap = hasMinimumTermOverlap(objectCombined, justificationCombined);
  if (overlap) {
    return [];
  }

  return [
    createValidationItem(
      'LEGAL_OBJECT_JUSTIFICATION_INCONSISTENT',
      'Baixa coerência estrutural entre objeto e justificativa. Verificar se a justificativa descreve adequadamente o objeto.',
      ValidationSeverity.WARNING,
      {
        details: {
          moduleId,
          objectLength: objectCombined.length,
          justificationLength: justificationCombined.length,
        },
      }
    ),
  ];
}

