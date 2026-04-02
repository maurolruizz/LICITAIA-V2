import type { ValidationItemContract } from '../../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../../core/enums/validation-severity.enum';
import { createValidationItem } from '../../../core/factories/validation-result.factory';
import type { ModuleId } from '../../../core/enums/module-id.enum';
import {
  hasMinimumTermOverlap,
  tokenizeForComparison,
} from '../cross-module/cross-module-consistency-rules';
import { hasVerifiableNormativeStructure } from './legal-basis-structure.util';

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
 * Coleta texto agregado para verificação de base legal em regimes diretos (DFD→PRICING).
 * Inclui justificativas do módulo, base legal declarada e trechos relevantes da estratégia.
 */
export function collectDirectRegimeLegalAggregate(
  moduleId: ModuleId,
  mergedData: Record<string, unknown>,
  processSnapshot: Record<string, unknown>
): string {
  const parts: string[] = [];
  const push = (v: unknown) => {
    const t = getLegalText(v);
    if (t) parts.push(t);
  };

  const cfg = getModuleLegalConfig(moduleId);
  if (cfg) {
    for (const f of cfg.justificationFields) {
      push(mergedData[f.field]);
    }
  }

  push(mergedData['legalBasis']);
  push(processSnapshot['legalBasis']);

  const mergePs = (src: Record<string, unknown>) => {
    const ps = src['procurementStrategy'];
    if (ps && typeof ps === 'object' && !Array.isArray(ps)) {
      const p = ps as Record<string, unknown>;
      push(p['legalBasis']);
      push(p['contractingJustification']);
    }
  };
  mergePs(mergedData);
  mergePs(processSnapshot);

  const mergeAj = (src: Record<string, unknown>) => {
    const aj = src['administrativeJustification'];
    if (aj && typeof aj === 'object' && !Array.isArray(aj)) {
      push((aj as Record<string, unknown>)['legalBasis']);
    }
  };
  mergeAj(mergedData);
  mergeAj(processSnapshot);

  return parts.join(' ').toLowerCase();
}

/**
 * Dispensa/inexigibilidade exigem citação normativa verificável (estrutural), não termos genéricos isolados.
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

  const aggregate = collectDirectRegimeLegalAggregate(moduleId, mergedData, processSnapshot);
  if (!aggregate.trim()) {
    return [];
  }

  if (hasVerifiableNormativeStructure(aggregate)) {
    return [];
  }

  return [
    createValidationItem(
      'INVALID_LEGAL_BASIS_STRUCTURE',
      `Regime ${regime} exige referência normativa concreta (artigo, lei ou ato numerado) nas justificativas/base legal do módulo ${moduleId}; termos genéricos como "dispensa" não bastam.`,
      ValidationSeverity.BLOCK,
      {
        details: { moduleId, regime, rule: 'STRUCTURAL_LEGAL_BASIS' },
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

